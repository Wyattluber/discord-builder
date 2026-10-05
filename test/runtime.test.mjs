import { test } from "node:test";
import assert from "node:assert/strict";
import {
  preparePayload, preparedOrNull, substituteVars, mentionsInTemplate, sendComponentsMessage, editComponentsMessage,
  COMPONENTS_V2_FLAG,
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
});
