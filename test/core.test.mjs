import { test } from "node:test";
import assert from "node:assert/strict";
import {
  serialize, deserialize, validate, makeBlock, makeContainer, makeText, IS_COMPONENTS_V2,
  wrapVariable, substituteVariables, mergeVariables, DISCORD_VARIABLES,
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
