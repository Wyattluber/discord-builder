// Viewport helper for the builder's mobile layout. Kept inside the builder
// folder so the component stays portable (no imports outside this directory).

import { useEffect, useState } from "react";

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
