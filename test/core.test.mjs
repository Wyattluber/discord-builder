import { test } from "node:test";
import assert from "node:assert/strict";
import {
  serialize, deserialize, validate, makeBlock, makeContainer, makeText, IS_COMPONENTS_V2,
  wrapVariable, substituteVariables, mergeVariables, DISCORD_VARIABLES,
  makeEmbed, makeEmbedField, emptyEmbedMessage, messageFormat, countEmbedChars, LIMITS,
} from "../dist/core.js";

const stored = {
  flags: IS_COMPONENTS_V2,
  components: [
    {
      type: 17,
      accent_color: 0x7c3aed,
      components: [
        { type: 10, content: "## Welcome, %user%" },
        { type: 14, divider: true, spacing: 1 },
        {
          type: 9,
          components: [{ type: 10, content: "Read the rules first." }],
          accessory: { type: 11, media: { url: "https://example.com/a.png" } },
        },
        { type: 1, components: [{ type: 2, style: 5, label: "Rules", url: "https://example.com/rules" }] },
      ],
    },
  ],
};

test("a stored payload reads back and writes out the same", () => {
  const once = serialize(deserialize(stored));
  assert.equal(once.flags, IS_COMPONENTS_V2);
  assert.deepEqual(serialize(deserialize(once)), once);
  assert.equal(once.components[0].type, 17);
  assert.equal(once.components[0].components[0].content, "## Welcome, %user%");
});

test("a Components V2 payload is written exactly as before embeds existed", () => {
  const model = deserialize(stored);
  assert.equal(messageFormat(model), "components");
  assert.deepEqual(Object.keys(model), ["components"]);
  // The serializer's output before the embed format, byte for byte
  assert.equal(
    JSON.stringify(serialize(model)),
    '{"flags":32768,"components":[{"type":17,"components":[{"type":10,"content":"## Welcome, %user%"},{"type":14,"divider":true,"spacing":1},{"type":9,"components":[{"type":10,"content":"Read the rules first."}],"accessory":{"type":11,"media":{"url":"https://example.com/a.png"}}},{"type":1,"components":[{"type":2,"style":5,"label":"Rules","url":"https://example.com/rules"}]}],"accent_color":8141549}]}',
  );
});

const classic = {
  content: "Hello %user%",
  embeds: [
    {
      author: { name: "Support", url: "https://example.com", icon_url: "https://example.com/icon.png" },
      title: "Welcome",
      url: "https://example.com/welcome",
      description: "Read **the rules**.",
      fields: [
        { name: "Members", value: "%memberCount%", inline: true },
        { name: "Rules", value: "Be kind." },
      ],
      image: { url: "https://example.com/banner.png" },
      thumbnail: { url: "%guildIcon%" },
      footer: { text: "Thanks", icon_url: "https://example.com/f.png" },
      timestamp: "now",
      color: 0x5865f2,
    },
    { description: "A second one" },
  ],
  components: [{ type: 1, components: [{ type: 2, style: 5, label: "Rules", url: "https://example.com/rules" }] }],
};

test("a classic payload reads back in embed format and writes out the same", () => {
  const model = deserialize(classic);
  assert.equal(messageFormat(model), "embeds");
  assert.equal(model.content, "Hello %user%");
  assert.equal(model.embeds.length, 2);
  assert.equal(model.embeds[0].fields[0].inline, true);
  assert.equal(model.embeds[0].timestamp, true);
  assert.equal(model.embeds[1].color, null);
  assert.deepEqual(serialize(model), classic);
  assert.deepEqual(serialize(deserialize(serialize(model))), classic);
});

test("embed format keeps only action rows and leaves out what is not set", () => {
  const model = deserialize({ embeds: [{}], components: [{ type: 10, content: "x" }, classic.components[0]] });
  assert.deepEqual(model.components.map((c) => c.type), ["action_row"]);
  assert.equal(model.content, "");
  const out = serialize({ ...emptyEmbedMessage(), components: [makeText("dropped"), ...model.components] });
  assert.deepEqual(Object.keys(out), ["embeds", "components"]);
  assert.deepEqual(out.embeds, [{ color: makeEmbed().color }]);
  assert.deepEqual(out.components.map((c) => c.type), [1]);
  assert.ok(!("flags" in out));
  // Discord requires an author name and footer text, so those go first
  const lonely = { ...makeEmbed(), color: null, author: { name: "", url: "https://x.y", iconUrl: "https://x.y/i.png" }, footer: { text: "", iconUrl: "https://x.y/f.png" } };
  assert.deepEqual(serialize({ format: "embeds", embeds: [lonely], components: [] }).embeds, [{}]);
});

test("validate enforces Discord's embed limits", () => {
  const messages = (model) => validate(model).map((i) => `${i.level}: ${i.message}`);
  const ok = { ...emptyEmbedMessage(), embeds: [{ ...makeEmbed(), title: "Hi" }] };
  assert.deepEqual(validate(ok), []);

  assert.ok(messages(emptyEmbedMessage()).includes("error: The message is empty. Add text, an embed or buttons."));
  assert.ok(messages(emptyEmbedMessage()).includes("warning: The embed is empty."));

  const long = (n) => "x".repeat(n);
  const field = (name, value) => ({ ...makeEmbedField(), name, value });
  const big = {
    ...makeEmbed(),
    title: long(257),
    description: long(4097),
    author: { name: long(257), url: "", iconUrl: "" },
    footer: { text: long(2049), iconUrl: "" },
    fields: [field(long(257), long(1025)), field("", "v"), ...Array.from({ length: 24 }, () => field("n", "v"))],
  };
  const row = { type: "action_row", id: "r", buttons: [] };
  const model = {
    format: "embeds",
    content: long(2001),
    embeds: [big, ...Array.from({ length: 10 }, () => ({ ...makeEmbed(), title: "t" }))],
    components: Array.from({ length: 6 }, (_, i) => ({ ...row, id: `r${i}` })),
  };
  const got = messages(model);
  for (const expected of [
    "error: Message text is longer than 2000 characters.",
    "error: Too many embeds: 11 of 10.",
    `error: Too much text in the embeds: ${countEmbedChars(model.embeds)} of 6000 characters.`,
    "error: Title is longer than 256 characters.",
    "error: Description is longer than 4096 characters.",
    "error: Author name is longer than 256 characters.",
    "error: Footer is longer than 2048 characters.",
    "error: Too many fields: 26 of 25.",
    "error: Field name is longer than 256 characters.",
    "error: Field value is longer than 1024 characters.",
    "warning: Field needs a name and a value.",
    "error: Too many action rows: 6 of 5.",
    `error: Action row needs 1 to ${LIMITS.actionRowButtons} buttons.`,
  ]) assert.ok(got.includes(expected), `missing "${expected}"`);
});

test("new blocks serialize to valid Components V2", () => {
  const model = { components: [makeContainer(), makeBlock("text"), makeText("hi")] };
  const out = serialize(model);
  assert.deepEqual(out.components.map((c) => c.type), [17, 10, 10]);
  assert.ok(Array.isArray(validate(model)));
});

test("the placeholder syntax is a setting", () => {
  const curly = { open: "{{", close: "}}" };
  assert.equal(wrapVariable("prize", curly), "{{prize}}");
  assert.equal(substituteVariables("Win {{prize}} now", { prize: "Nitro" }, curly), "Win Nitro now");
  assert.equal(substituteVariables("Win %prize% now", { prize: "Nitro" }), "Win Nitro now");
});

test("merging variable lists keeps the first entry per name", () => {
  const mine = [{ name: DISCORD_VARIABLES[0].name, sample: "mine" }];
  const merged = mergeVariables(mine, DISCORD_VARIABLES);
  assert.equal(merged.filter((v) => v.name === mine[0].name).length, 1);
  assert.equal(merged.find((v) => v.name === mine[0].name).sample, "mine");
});

// The emoji entry imports a JSON package, which Node only loads through a
// bundler; esbuild stands in for the host's here
async function bundledEmoji() {
  const { build } = await import("esbuild");
  const out = await build({ entryPoints: ["dist/emoji.js"], bundle: true, format: "esm", platform: "node", write: false });
  return import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`);
}

test("emoji search finds by keyword and by shortcode prefix", async () => {
  const { searchEmojis, searchShortcodes } = await bundledEmoji();
  assert.ok(searchEmojis("cat").length > 0);
  const hits = searchShortcodes(":smil");
  assert.ok(hits.length > 0 && hits.length <= 8);
  assert.ok(hits[0].shortcode.startsWith("smil"));
  assert.deepEqual(searchShortcodes(""), []);
});
