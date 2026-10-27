import { test } from "node:test";
import assert from "node:assert/strict";
import {
  preparePayload, preparedOrNull, substituteVars, mentionsInTemplate, sendComponentsMessage, editComponentsMessage,
  sendPreparedMessage, editPreparedMessage, COMPONENTS_V2_FLAG,
} from "../dist/runtime.js";

test("variables are filled in, unknown ones stay", () => {
  assert.deepEqual(substituteVars({ a: ["%x% and %y%"] }, { x: 1 }), { a: ["1 and %y%"] });
  assert.equal(substituteVars("{{x}}", { x: "ok" }, { open: "{{", close: "}}" }), "ok");
});

test("what did not resolve is dropped instead of sent broken", () => {
  const raw = JSON.stringify({
    components: [{
      type: 17,
      components: [
        { type: 10, content: "%reason%" },
        { type: 9, components: [{ type: 10, content: "Hi" }], accessory: { type: 11, media: { url: "%icon%" } } },
        { type: 12, items: [{ media: { url: "" } }] },
        { type: 1, components: [{ type: 2, style: 5, label: "Join", url: "%invite%" }] },
      ],
    }],
  });
  const out = preparePayload(raw, { reason: "  " });
  assert.deepEqual(out.components, [{ type: 17, components: [{ type: 10, content: "Hi" }] }]);
  assert.equal(preparedOrNull(JSON.stringify({ components: [{ type: 10, content: "%gone%" }] }), { gone: "" }), null);
  assert.equal(preparedOrNull("{not json", {}, { label: "test" }), null);
});

test("media the resolver knows becomes an attachment, once per asset", () => {
  const url = "https://example.com/public/builder-media/7";
  const raw = { components: [{ type: 12, items: [{ media: { url } }, { media: { url } }] }] };
  const out = preparePayload(raw, {}, { media: { match: /builder-media\/(\d+)/, load: (id) => ({ name: "cat pic.png", data: `bytes-${id}` }) } });
  assert.deepEqual(out.files, [{ name: "7-cat_pic.png", data: "bytes-7" }]);
  assert.equal(out.components[0].items[1].media.url, "attachment://7-cat_pic.png");
});

test("only mentions written in the template may ping", () => {
  assert.deepEqual(mentionsInTemplate({ c: "<@&1> <@2> %reason%" }), { parse: [], roles: ["1"], users: ["2"] });
  const out = preparePayload({ components: [{ type: 10, content: "%reason%" }] }, { reason: "@everyone <@&9>" });
  assert.deepEqual(out.allowedMentions, { parse: [], roles: [], users: [] });
});

test("send and edit post a Components V2 body to the right route", async () => {
  const calls = [];
  const client = { rest: { post: async (route, o) => calls.push(["post", route, o]), patch: async (route, o) => calls.push(["patch", route, o]) } };
  await sendComponentsMessage(client, "10", [{ type: 10, content: "x" }], { files: [{ name: "a.png", data: 1 }] });
  await editComponentsMessage(client, "10", "20", []);
  assert.equal(calls[0][1], "/channels/10/messages");
  assert.equal(calls[0][2].body.flags, COMPONENTS_V2_FLAG);
  assert.deepEqual(calls[0][2].body.attachments, [{ id: 0, filename: "a.png" }]);
  assert.deepEqual(calls[0][2].body.allowed_mentions, { parse: [] });
  assert.equal(calls[1][1], "/channels/10/messages/20");
  // An edit may turn a classic message into V2: its text and embeds are emptied
  assert.equal(calls[1][2].body.content, null);
  assert.deepEqual(calls[1][2].body.embeds, []);
  assert.ok(!("content" in calls[0][2].body), "a new message sends no empty text");
});

const recorder = () => {
  const calls = [];
  return { calls, client: { rest: { post: async (route, o) => calls.push(["post", route, o]), patch: async (route, o) => calls.push(["patch", route, o]) } } };
};

test("a Components V2 payload prepares as before, with no embeds and no text", () => {
  const out = preparePayload({ components: [{ type: 10, content: "Hi" }] }, {});
  assert.equal(out.componentsV2, true);
  assert.deepEqual(out.embeds, []);
  assert.equal(out.content, undefined);
});

test("embeds lose what came out blank or did not resolve, and the time is filled in", () => {
  const raw = JSON.stringify({
    content: "%greeting%",
    embeds: [
      {
        title: "Order %order%",
        url: "%orderLink%",
        author: { name: "%staff%", icon_url: "https://example.com/a.png" },
        fields: [{ name: "Note", value: "%note%" }, { name: "%empty%", value: "x" }, { name: "Total", value: "%total%", inline: true }],
        image: { url: "%banner%" },
        thumbnail: { url: "" },
        footer: { text: "Shop", icon_url: "%shopIcon%" },
        timestamp: "now",
      },
      { description: "%reason%", color: 1, timestamp: "now" },
      { description: "Kept", timestamp: "%when%" },
    ],
    components: [{ type: 1, components: [{ type: 2, style: 5, label: "Join", url: "%invite%" }] }],
  });
  const before = Date.now();
  const out = preparePayload(raw, { greeting: " ", order: "42", staff: "", note: "", empty: " ", total: "9 €", reason: "" });
  assert.equal(out.componentsV2, false);
  assert.equal(out.content, undefined);
  assert.equal(out.embeds.length, 2);
  const [first, second] = out.embeds;
  assert.equal(first.title, "Order 42");
  assert.ok(!("url" in first) && !("author" in first) && !("image" in first) && !("thumbnail" in first));
  assert.deepEqual(first.fields, [{ name: "Total", value: "9 €", inline: true }]);
  assert.deepEqual(first.footer, { text: "Shop" });
  const sent = Date.parse(first.timestamp);
  assert.ok(sent >= before - 1000 && sent <= Date.now() + 1000);
  assert.deepEqual(second, { description: "Kept" });
  assert.deepEqual(out.components, []);

  assert.equal(preparedOrNull(JSON.stringify({ content: "%x%", embeds: [{ title: "%x%" }], components: [] }), { x: "" }), null);
  assert.ok(preparedOrNull(JSON.stringify({ content: "Only text", embeds: [] }), {}));
});

test("embed images and icons the resolver knows become attachments, links stay links", () => {
  const url = "https://example.com/public/builder-media/7";
  const raw = {
    embeds: [{
      title: "Shop", url,
      author: { name: "Staff", url, icon_url: url },
      image: { url },
      footer: { text: "Thanks", icon_url: "https://example.com/public/builder-media/8" },
    }],
  };
  const out = preparePayload(raw, {}, { media: { match: /builder-media\/(\d+)/, load: (id) => ({ name: "pic.png", data: `bytes-${id}` }) } });
  assert.deepEqual(out.files.map((f) => f.name), ["7-pic.png", "8-pic.png"]);
  const [embed] = out.embeds;
  assert.equal(embed.image.url, "attachment://7-pic.png");
  assert.equal(embed.author.icon_url, "attachment://7-pic.png");
  assert.equal(embed.footer.icon_url, "attachment://8-pic.png");
  assert.equal(embed.url, url);
  assert.equal(embed.author.url, url);
});

test("only mentions written into an embed template may ping", () => {
  const out = preparePayload({ content: "<@&1> %reason%", embeds: [] }, { reason: "<@2> @everyone" });
  assert.equal(out.content, "<@&1> <@2> @everyone");
  assert.deepEqual(out.allowedMentions, { parse: [], roles: ["1"], users: [] });
});

test("a prepared classic message is sent without the V2 flag, a V2 one with it", async () => {
  const { calls, client } = recorder();
  const classic = preparePayload({ content: "Hi", embeds: [{ title: "T" }], components: [] }, {});
  await sendPreparedMessage(client, "10", classic);
  const body = calls[0][2].body;
  assert.equal(calls[0][1], "/channels/10/messages");
  assert.ok(!("flags" in body));
  assert.equal(body.content, "Hi");
  assert.deepEqual(body.embeds, [{ title: "T" }]);
  assert.deepEqual(body.components, []);
  assert.deepEqual(body.allowed_mentions, { parse: [], roles: [], users: [] });

  const v2 = preparePayload({ components: [{ type: 10, content: "x" }] }, {});
  await sendPreparedMessage(client, "10", v2, { files: [{ name: "a.png", data: 1 }] });
  assert.equal(calls[1][2].body.flags, COMPONENTS_V2_FLAG);
  assert.ok(!("embeds" in calls[1][2].body) && !("content" in calls[1][2].body));
  assert.deepEqual(calls[1][2].body.attachments, [{ id: 0, filename: "a.png" }]);
  assert.deepEqual(calls[1][2].files, [{ name: "a.png", data: 1 }]);

  // An edit clears text the old message had
  const noText = preparePayload({ embeds: [{ title: "T" }] }, {});
  await editPreparedMessage(client, "10", "20", noText);
  assert.equal(calls[2][0], "patch");
  assert.equal(calls[2][1], "/channels/10/messages/20");
  assert.equal(calls[2][2].body.content, "");
  assert.ok(!("flags" in calls[2][2].body));
  await sendPreparedMessage(client, "10", noText);
  assert.ok(!("content" in calls[3][2].body));
});
