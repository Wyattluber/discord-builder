// The builder's own form primitives, so the folder carries no import from the
// host app. They are deliberately plain: a button, an input, a textarea, a
// switch, a skeleton and a bare modal, styled with the theme tokens documented
// in theme.css. A host with its own design system overrides the modal through
// the integrations (the only one where behaviour, not looks, differs) and can
// restyle the rest through those tokens.

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  default: "bg-foreground text-background hover:opacity-90",
  secondary: "bg-muted text-foreground border border-border hover:bg-muted/70",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted/60",
  ghost: "bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  destructive: "bg-red-600 text-white hover:bg-red-500",
};

const SIZES: Record<Size, string> = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-6 text-sm",
  icon: "h-9 w-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";

const FIELD_CLS = "w-full rounded-lg border border-border bg-muted text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-dbx-accent-500 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`flex h-9 px-3 py-1 ${FIELD_CLS} ${className}`} {...props} />
  ),
);
Input.displayName = "Input";

// Before paint in the browser, so a field never shows a frame at the old
// height; on the server there is nothing to measure.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Grows and shrinks with its text: never below `rows`, never with a scrollbar
 * of its own, so there is no resize handle to drag. Widths change the wrap,
 * so a resize measures again.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => {
    const inner = useRef<HTMLTextAreaElement | null>(null);
    const setRefs = useCallback((el: HTMLTextAreaElement | null) => {
      inner.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    }, [ref]);

    const fit = useCallback(() => {
      const el = inner.current;
      if (!el) return;
      // Collapsing the field to measure it shortens the page for a moment,
      // which would pull whatever scrolls around it back up.
      const scrolled: [HTMLElement, number][] = [];
      for (let p = el.parentElement; p; p = p.parentElement) if (p.scrollTop) scrolled.push([p, p.scrollTop]);
      const pageY = window.scrollY;
      el.style.height = "auto";
      // scrollHeight leaves out the border, which border-box sizing counts
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
      for (const [p, top] of scrolled) p.scrollTop = top;
      if (window.scrollY !== pageY) window.scrollTo(window.scrollX, pageY);
    }, []);

    useBrowserLayoutEffect(fit, [fit, props.value]);

    useEffect(() => {
      const el = inner.current;
      if (!el) return;
      let width = el.clientWidth;
      const ro = new ResizeObserver(() => {
        if (el.clientWidth === width) return;
        width = el.clientWidth;
        fit();
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, [fit]);

    return <textarea ref={setRefs} className={`flex min-h-16 resize-none overflow-hidden px-3 py-2 ${FIELD_CLS} ${className}`} {...props} />;
  },
);
Textarea.displayName = "Textarea";

export function Switch({ checked, onCheckedChange, disabled, className = "" }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-border"} ${className}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Classes for the panel, e.g. a width cap. */
  className?: string;
  children: ReactNode;
}

/**
 * The fallback modal: enough for the media library, no more. It closes on
 * Escape and on a click outside, and it does not lock the page scroll or trap
 * focus - a host that stacks dialogs (as ours does: the builder itself lives in
 * one) passes its own through `integrations.modal`.
 */
export function Modal({ open, onOpenChange, title, className = "", children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full rounded-xl border border-border bg-card p-4 text-foreground shadow-xl ${className}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
