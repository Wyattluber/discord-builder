# discord-builder

A Discord Components V2 message editor with a live preview, the model and
serializer behind it, and the Node side that sends a stored payload. One copy
for every project that builds Discord messages, so a change made here reaches
all of them.

Three entry points, so a bot without a dashboard does not pull React and a
dashboard without a bot does not pull anything it cannot use:

| Import | What it is | Needs |
| --- | --- | --- |
| `@wyattluber/discord-builder/react` | the editor and the preview | React 18 or 19, Tailwind v4, `lucide-react`, `unicode-emoji-json` |
| `@wyattluber/discord-builder/core` | model, building blocks, `serialize`, `deserialize`, placeholder syntax, variable presets | nothing |
| `@wyattluber/discord-builder/runtime` | fill in variables, drop what did not resolve, media as attachments, send and edit over REST | nothing (ESM and `require()`) |

## Install

Releases are git tags; `dist/` is committed, so nothing is built on install.

```sh
npm install github:Wyattluber/discord-builder#v1.0.0
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

**Click behaviour.** `button.action` is host data: the builder carries it
through the model and the serializer drops it, because Discord's payload has no
such field. `DiscordActionEditor` offers reply / DM / post to a channel; a host
with other actions passes its own editor.

## In a bot

```js
import { preparedOrNull, sendComponentsMessage } from "@wyattluber/discord-builder/runtime";
// or: const { preparedOrNull, sendComponentsMessage } = require("@wyattluber/discord-builder/runtime");

const media = { match: /\/public\/builder-media\/(\w+)/, load: (id) => db.getMedia(id) };
const prepared = preparedOrNull(row.payload, { user: member.displayName }, { media, label: "welcome" });
if (prepared) {
  await sendComponentsMessage(client, channelId, prepared.components, {
    files: prepared.files,
    allowedMentions: prepared.allowedMentions,
  });
}
```

`client` is anything with a discord.js-style `rest.post` and `rest.patch`; a
discord.js client works as it is. Mentions only ping when they were written in
the template itself, never when they arrive through a variable.

## Working on it

```sh
npm install
npm run build      # writes dist/, commit it with the change
npm test
npm run typecheck
```

A release is a tag (`v1.2.0`) on a commit whose `dist/` is current; CI refuses
a push where it is not.
