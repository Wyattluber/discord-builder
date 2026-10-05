// Viewport helper for the builder's mobile layout. Kept inside the builder
// folder so the component stays portable (no imports outside this directory).

import { useEffect, useState, type RefObject } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // the query may have changed between render and effect
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True below Tailwind's `lg`, where the builder drops to a single column:
 *  editor and preview become tabs and drag handles turn into arrow buttons. */
export function useIsCompact(): boolean {
  return useMediaQuery("(max-width: 1023px)");
}

/** The nearest ancestor that scrolls (a dialog's body), or null for the window. */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if (overflowY === "auto" || overflowY === "scroll") return p;
  }
  return null;
}

/**
 * How tall a sticky pane may be: the visible height of the container it
 * scrolls in, the window or a dialog's body, less `inset` for the gaps above
 * and below. Null while off, so the pane keeps its natural height.
 */
export function useVisibleHeight(ref: RefObject<HTMLElement | null>, enabled: boolean, inset = 32): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) { setHeight(null); return; }
    const scroller = scrollParent(el);
    const measure = () => setHeight(Math.max(240, (scroller?.clientHeight ?? window.innerHeight) - inset));
    measure();
    const ro = scroller ? new ResizeObserver(measure) : null;
    ro?.observe(scroller!);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ref, enabled, inset]);

  return height;
}
