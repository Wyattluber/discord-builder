// What the bot does when a button is clicked - the one part of the model that
// is not Discord's, but the host app's. This file is the shipped default: reply
// privately, DM the clicker, post to a channel. A project whose bot answers
// clicks differently passes its own editor as `integrations.actionEditor` and
// puts whatever shape it likes into `button.action`; the builder carries it
// through the model untouched and the serializer drops it, because Discord's
// payload has no such field.

import { Pencil } from "lucide-react";
import { Button } from "./ui";
import { useBuilderIntegrations, useSyntax } from "./context";
import { FieldLabel, MarkdownField, SegmentToggle, SwitchRow } from "./fields";
import { wrapVariable } from "./syntax";
import type { ButtonAction, ButtonActionData, ButtonActionType, TemplateVariable } from "./types";

export interface ActionEditorProps {
  /** Whatever the host stores on the button; undefined until it is set. */
  action: ButtonActionData | undefined;
  onChange: (action: ButtonActionData | undefined) => void;
  /** The variables offered in the response text, if any. */
  variables?: TemplateVariable[];
}

const BUTTON_ACTION_OPTIONS: { value: ButtonActionType; label: string }[] = [
  { value: "none", label: "Nothing" },
  { value: "reply", label: "Private reply" },
  { value: "send_dm", label: "DM the user" },
  { value: "send_channel", label: "Post in a channel" },
];

export function DiscordActionEditor({ action: raw, onChange, variables }: ActionEditorProps) {
  const { channels, editRichMessage } = useBuilderIntegrations();
  const syntax = useSyntax();
  // The only cast in the builder: the model carries host data, and this editor
  // is the one place that claims to know its shape.
  const action = (raw ?? { type: "none" }) as ButtonAction;
  const setAction = (patch: Partial<ButtonAction>) => onChange({ ...action, ...patch });

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-background/40 p-2">
      <div className="space-y-1">
        <FieldLabel>On click</FieldLabel>
        <SegmentToggle
          options={BUTTON_ACTION_OPTIONS}
          value={action.type}
          onChange={(type: ButtonActionType) => setAction({ type })}
        />
      </div>
      {action.type !== "none" && (
        <>
          {action.type === "send_channel" && (
            <div className="space-y-1">
              <FieldLabel>Channel</FieldLabel>
              <select
                value={action.channelId ?? ""}
                onChange={(e) => setAction({ channelId: e.target.value || undefined })}
                className="h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs"
              >
                <option value="">Choose a channel…</option>
                {(channels ?? []).map((c) => (
                  <option key={c.id} value={c.id}># {c.name}</option>
                ))}
              </select>
            </div>
          )}
          {editRichMessage && (
            <div className="space-y-1">
              <FieldLabel>Response type</FieldLabel>
              <SegmentToggle
                options={[{ value: "text", label: "Text" }, { value: "rich", label: "Rich message" }]}
                value={action.rich ? "rich" : "text"}
                onChange={(v) => setAction({ rich: v === "rich" })}
              />
            </div>
          )}
          {action.rich && editRichMessage ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
              <span className="text-xs text-muted-foreground">
                {action.model && action.model.components.length > 0
                  ? `Rich message · ${action.model.components.length} block${action.model.components.length === 1 ? "" : "s"}`
                  : "No message yet"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => editRichMessage(action.model, (model) => setAction({ model }))}
              >
                <Pencil className="mr-1 h-3 w-3" /> {action.model ? "Edit" : "Create"} message
              </Button>
            </div>
          ) : (
            <MarkdownField
              label={action.type === "send_dm" ? "DM message" : action.type === "reply" ? "Reply message" : "Message to post"}
              value={action.content ?? ""}
              onChange={(content) => setAction({ content })}
              variables={variables}
              rows={3}
              max={2000}
              placeholder={`Hey ${wrapVariable("user", syntax)}, thanks for clicking!`}
            />
          )}
          {action.type === "reply" && (
            <SwitchRow
              label="Private reply (only the user who clicked sees it)"
              checked={action.ephemeral !== false}
              onChange={(v) => setAction({ ephemeral: v })}
            />
          )}
          <p className="text-[11px] text-muted-foreground">
            Needs a custom ID. The action is saved when the message is sent.
          </p>
        </>
      )}
    </div>
  );
}
