/** How a variable is written in a stored payload, e.g. `%name%` or `{{name}}`. */
interface PlaceholderSyntax {
    open: string;
    close: string;
}
declare const PERCENT_PLACEHOLDERS: PlaceholderSyntax;
/** Discord's IS_COMPONENTS_V2 message flag (1 << 15). */
declare const COMPONENTS_V2_FLAG: number;
/** A file to upload with the message. */
interface MessageFile {
    name: string;
    data: unknown;
}
/** Finds the media a payload points at and loads it. */
interface MediaResolver {
    /** Matches a stored media URL; capture group 1 is the asset id. */
    match: RegExp;
    /** The asset, or null when there is none (the URL then stays as it is). */
    load: (id: string) => {
        name?: string | null;
        data: unknown;
    } | null | undefined;
}
interface AllowedMentions {
    parse: string[];
    roles?: string[];
    users?: string[];
}
interface PreparedPayload {
    components: unknown[];
    files: MessageFile[];
    allowedMentions: AllowedMentions;
}
interface PrepareOptions {
    syntax?: PlaceholderSyntax;
    media?: MediaResolver | null;
}
/** Anything that can send REST requests the way discord.js's `client.rest` does. */
interface RestClient {
    rest: {
        post: (route: `/${string}`, options: {
            body: unknown;
            files?: MessageFile[];
        }) => Promise<unknown>;
        patch: (route: `/${string}`, options: {
            body: unknown;
            files?: MessageFile[];
        }) => Promise<unknown>;
    };
}
interface SendOptions {
    files?: MessageFile[];
    allowedMentions?: AllowedMentions;
}
type Json = any;
/** Matches one placeholder; capture group 1 is the variable name. */
declare function variablePattern(syntax?: PlaceholderSyntax, flags?: string): RegExp;
/** Deep-clones `value`, replacing every placeholder in every string. Unknown names stay as they are. */
declare function substituteVars<T>(value: T, vars: Record<string, unknown>, syntax?: PlaceholderSyntax): T;
/**
 * Walks a payload, finds the media URLs the resolver recognises, loads them
 * and rewrites the URLs to attachment://. MUTATES the payload. Returns the
 * files to upload alongside the message. Without a resolver, URLs are left alone.
 */
declare function collectMediaAttachments(payload: Json, media?: MediaResolver | null): MessageFile[];
/** Sends a Components V2 message via raw REST. Returns the raw message data. */
declare function sendComponentsMessage(client: RestClient, channelId: string, components: unknown[], options?: SendOptions): Promise<unknown>;
/** Edits an existing Components V2 message via raw REST. */
declare function editComponentsMessage(client: RestClient, channelId: string, messageId: string, components: unknown[], options?: SendOptions): Promise<unknown>;
/**
 * Mentions the author wrote into the template themselves may ping; text
 * that arrives through a variable (a member's reason, a form answer) never
 * may. So the allow list is read from the template before substitution:
 * @everyone/@here, each role, each user.
 */
declare function mentionsInTemplate(rawPayload: unknown): AllowedMentions;
/**
 * Prepares a stored payload for sending: substitute variables, drop what did
 * not resolve, resolve media. `rawPayload` is the stored JSON (string or
 * object) with a `components` array.
 */
declare function preparePayload(rawPayload: unknown, vars: Record<string, unknown>, { syntax, media }?: PrepareOptions): PreparedPayload;
/**
 * A stored payload prepared for sending, or null when there is none, it
 * does not parse, or it renders to nothing: the caller then uses its
 * built-in message. `label` names the payload in the log so a broken one
 * can be found.
 */
declare function preparedOrNull(rawPayload: unknown, vars: Record<string, unknown>, options?: PrepareOptions & {
    label?: string;
}): PreparedPayload | null;

export { type AllowedMentions, COMPONENTS_V2_FLAG, type MediaResolver, type MessageFile, PERCENT_PLACEHOLDERS, type PlaceholderSyntax, type PrepareOptions, type PreparedPayload, type RestClient, type SendOptions, collectMediaAttachments, editComponentsMessage, mentionsInTemplate, preparePayload, preparedOrNull, sendComponentsMessage, substituteVars, variablePattern };
