// Optional host-app integrations for the builder: channel list, user search,
// server emojis, the media library, the dialog component and the editor for a
// button's click behaviour. Provided by DiscordMessageBuilder, consumed deeper
// in the tree. All optional, so the builder runs standalone.

import { createContext, useContext, type ComponentType } from "react";
import type { ActionEditorProps } from "./ButtonActions";
import type { ButtonActionData, MessageModel } from "./types";
import type { ModalProps } from "./ui";
import { PERCENT_PLACEHOLDERS, type PlaceholderSyntax } from "./syntax";

export interface ChannelLite { id: string; name: string }
export interface UserLite { id: string; name: string; avatar?: string | null }
export interface EmojiLite { name: string; id: string; animated: boolean }
export interface MediaAsset { id: string; name: string | null; type: string | null; size: number; url: string; created_at: string }
export interface MediaLibrary {
  list: () => Promise<MediaAsset[]>;
  remove: (id: string) => Promise<void>;
}

/** A reusable saved button action, offered for custom-id autofill/reuse. */
export interface SavedButtonAction {
  customId: string;
  label?: string;
  action: ButtonActionData;
}

export interface BuilderIntegrations {
  channels?: ChannelLite[];
  searchUsers?: (query: string) => Promise<UserLite[]>;
  emojis?: EmojiLite[];
  media?: MediaLibrary;
  /**
   * Opens a nested builder to edit a rich button-action response. Provided by
   * the host app (it owns the dialog); `save` receives the edited model.
   * Optional so the builder stays portable; without it, button actions only
   * offer plain-text responses.
   */
  editRichMessage?: (initial: MessageModel | undefined, save: (m: MessageModel) => void) => void;
  /**
   * Previously-saved button actions, for custom-id autofill and reuse. When a
   * button's custom id matches one, the editor offers to load its action.
   */
  savedActions?: SavedButtonAction[];
  /**
   * The host's dialog component, used for the media library. Without it the
   * builder falls back to its own bare modal (see ui.tsx), which is fine
   * standalone but knows nothing about dialogs stacking, page scroll locking or
   * focus trapping - a host that has solved those passes its own.
   */
  modal?: ComponentType<ModalProps>;
  /**
   * The editor for a button's click behaviour. Without it the shipped one is
   * used (reply / DM / post to channel); a host whose bot answers clicks
   * differently passes its own and owns the shape stored on the button.
   * `null` when the host's bot answers no clicks at all: buttons then offer
   * only their custom ID.
   */
  actionEditor?: ComponentType<ActionEditorProps> | null;
}

export const BuilderContext = createContext<BuilderIntegrations>({});
export const useBuilderIntegrations = () => useContext(BuilderContext);

/**
 * The placeholder syntax in use, so the fields deep in the tree write and read
 * variables the same way the preview renders them. Defaults to %name%.
 */
export const SyntaxContext = createContext<PlaceholderSyntax>(PERCENT_PLACEHOLDERS);
export const useSyntax = () => useContext(SyntaxContext);

/**
 * The variable palette: one panel next to the preview that lists every
 * %variable% with its live value. A markdown field's % button opens it; a
 * click there copies the placeholder and leaves every field as it is.
 */
export interface PaletteApi {
  open: () => void;
}
export const PaletteContext = createContext<PaletteApi>({ open: () => {} });
export const usePalette = () => useContext(PaletteContext);
