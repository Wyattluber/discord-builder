# discord-builder

A Discord message editor with a live preview, for Components V2 and for
classic embeds, the model and serializer behind it, and the Node side that
sends a stored payload. One copy for every project that builds Discord
messages, so a change made here reaches all of them.

Three entry points, so a bot without a dashboard does not pull React and a
dashboard without a bot does not pull anything it cannot use:

| Import | What it is | Needs |
| --- | --- | --- |
| `@wyattluber/discord-builder/react` | the editor and the preview | React 18 or 19, Tailwind v4, `lucide-react`, `unicode-emoji-json` |
| `@wyattluber/discord-builder/emoji` | unicode emoji search by keyword and by `:shortcode:`, for a composer outside the builder | `unicode-emoji-json` |
| `@wyattluber/discord-builder/core` | model, building blocks, `serialize`, `deserialize`, placeholder syntax, variable presets | nothing |
| `@wyattluber/discord-builder/runtime` | fill in variables, drop what did not resolve, media as attachments, send and edit over REST | nothing (ESM and `require()`) |

## Install

Releases are git tags; `dist/` is committed, so nothing is built on install.

```sh
npm install github:Wyattluber/discord-builder#v1.5.0
```

## In a dashboard

```css
@import "tailwindcss";
@import "@wyattluber/discord-builder/theme.css";
/* Tailwind does not scan node_modules on its own */
@source "../node_modules/@wyattluber/discord-builder/dist";

@theme { /* your values win over the builder's defaults */ }
```

The `@source` path is relative to the CSS file. `theme.css` holds the tokens
the builder paints with: the usual shadcn palette (`card`, `border`,
`muted-foreground`, ...), which most projects already define, and the
`dbx-accent` scale, the builder's own highlight. Tailwind v4 only generates a
utility for a token that exists, so a missing one renders as no colour at all.

```tsx
import { DiscordMessageBuilder, deserialize, serialize } from "@wyattluber/discord-builder/react";
```

## The seams

The builder knows nothing about the app around it. What it needs, it asks for.

**Variables.** None are built in. Whatever `variables` a host passes is the
whole offer; passing nothing hides the palette, the `%` button and the
autocomplete. `DISCORD_VARIABLES` and `CLICKER_VARIABLES` are the usual set to
spread if you want it, plus `mergeVariables` (first entry per name wins) and
`applyVariableSamples` (live values for the preview).

**Placeholder syntax.** `%name%` by default; pass `syntax={{ open: "{{", close:
"}}" }}` and the editor, the autocomplete, the palette and the preview follow.
The runtime takes the same shape.

**Integrations** (`BuilderContext`, all optional): channel list, user search,
server emojis, the media library, the host's dialog component (`modal`) and the
editor for a button's click behaviour (`actionEditor`). Without a dialog the
builder uses its own bare modal; without an action editor, the shipped one.

**Custom emoji in text fields.** The markdown fields show `<:name:id>` and
`<a:name:id>` as the emoji image while the value stays that text. One whose
image doesn't load (wrong ID, deleted) shows as a red `:name:`. Copying a
selection copies the tokens; paste is plain text.

**Click behaviour.** `button.action` is host data: the builder carries it
through the model and the serializer drops it, because Discord's payload has no
such field. `DiscordActionEditor` offers reply / DM / post to a channel; a host
with other actions passes its own editor, and one whose bot answers no clicks
passes `actionEditor: null`, so a button offers only its custom ID.

## Components V2 or embeds

Discord takes a message as Components V2 or as a classic message (text, up to
10 embeds and the action rows under them), never both at once. Each host
decides what its builder offers with `formats`:

```tsx
<DiscordMessageBuilder value={model} onChange={setModel} />                                   // Components V2, as before
<DiscordMessageBuilder value={model} onChange={setModel} formats={["embeds"]} />              // embeds only
<DiscordMessageBuilder value={model} onChange={setModel} formats={["components", "embeds"]} /> // both, with a switch
```

With both, the switch keeps the other format's message while the editor is
open, but only the active one reaches `onChange`. A stored message in a format
the host leaves out still opens, in its own format. A blank starter
(`startingMessage()`) opens in the first format offered; `emptyEmbedMessage()`
is the embed starter.

In the model, `format: "embeds"` carries `content`, `embeds` and `components`
(action rows only); a model without `format` is Components V2. `serialize`
writes, and `deserialize` and the runtime read:

```jsonc
// Components V2, byte for byte as before
{ "flags": 32768, "components": [ ... ] }

// Classic: an embeds array is what marks it
{
  "content": "Hello %user%",                       // left out when empty
  "embeds": [{
    "author": { "name": "Support", "url": "https://…", "icon_url": "https://…" },
    "title": "Welcome", "url": "https://…", "description": "Read **the rules**.",
    "fields": [{ "name": "Members", "value": "%memberCount%", "inline": true }],
    "image": { "url": "https://…" }, "thumbnail": { "url": "%guildIcon%" },
    "footer": { "text": "Thanks", "icon_url": "https://…" },
    "timestamp": "now",                            // the send time, filled in by the runtime
    "color": 5793266
  }],
  "components": [{ "type": 1, "components": [ ... ] }]
}
```

Only what is set is written. Store the whole result of `serialize`: a host
that keeps only `.components` loses the text and the embeds. `validate` checks
Discord's limits for both formats (`LIMITS`: 10 embeds, 6000 characters across
them, 25 fields, the per-part lengths, 2000 for the text, 5 action rows).

## In a bot

```js
import { preparedOrNull, sendPreparedMessage } from "@wyattluber/discord-builder/runtime";
// or: const { preparedOrNull, sendPreparedMessage } = require("@wyattluber/discord-builder/runtime");

const media = { match: /\/public\/builder-media\/(\w+)/, load: (id) => db.getMedia(id) };
const prepared = preparedOrNull(row.payload, { user: member.displayName }, { media, label: "welcome" });
if (prepared) await sendPreparedMessage(client, channelId, prepared);
```

`preparePayload` and `preparedOrNull` return `{ components, embeds, content,
componentsV2, files, allowedMentions }`; `preparedOrNull` is null when there is
nothing to send. `sendPreparedMessage(client, channelId, prepared, options?)`
and `editPreparedMessage(client, channelId, messageId, prepared, options?)`
send either format: the V2 flag for Components V2, `content` and `embeds`
otherwise. `options.files` and `options.allowedMentions` replace the payload's
own. An edit always writes `content`, so text the old message had is cleared.
`sendComponentsMessage` and `editComponentsMessage` still send Components V2 as
before.

After the variables are filled in, an embed drops a field with a blank name or
value, a URL that did not resolve, an author or footer left without text, and
goes when nothing is left; `"timestamp": "now"` becomes the current time.
Embed images and the author and footer icons resolve to attachments like any
other media.

`client` is anything with a discord.js-style `rest.post` and `rest.patch`; a
discord.js client works as it is. Mentions only ping when they were written in
the template itself, never when they arrive through a variable.

## Working on it

```sh
npm install
npm run bundle     # writes dist/, commit it with the change
npm test
npm run typecheck
```

The script is not called `build` on purpose: npm runs `npm install` inside a
git dependency that has one, which would pull every dev dependency into each
project that installs this.

A release is a tag (`v1.2.0`) on a commit whose `dist/` is current; CI refuses
a push where it is not.

## Releases reach every project on their own

Pushing a tag runs `.github/workflows/release.yml`: it checks the package
again, then commits the new version into every project that uses it, on the
branch that project deploys from:

| Project | Branch | What happens next |
| --- | --- | --- |
| `Wyattluber/sorin-support` | `staging` | its pipeline tests, builds and deploys staging; production follows with its next release |
| `Wyattluber/sorinscriptsdash-jun_2026` | `main` | checked with a build first; Cloudflare Pages deploys |
| `Wyattluber/botvault` | `main` | checked with typecheck and build first; deployed by hand |

The workflow pushes with the `CONSUMER_TOKEN` secret, a fine-grained token
with "Contents: read and write" on those repositories. Since it commits to
them, pull before pushing there after a release. A project joins with one
line in the workflow's matrix. To roll out a tag again (a project that
failed, or one that just joined), run the workflow by hand with the tag.
