/** Highlighter-marker stroke behind a key word. Use at most once per section. */
export function Highlight({ children }: { children: React.ReactNode }) {
  return <mark className="marker">{children}</mark>;
}
