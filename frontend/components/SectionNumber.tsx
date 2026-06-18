/*
  Section index — the small mono register number that prefixes a heading.
  One component so every page numbers identically (see the /NN scheme in Nav order).
  Baseline-aligned against .page-title / .section-title; the offset nudges the
  short number up so it reads as a running header, not a footnote.
*/
export default function SectionNumber({
  n,
  className = "",
}: {
  n: string;
  className?: string;
}) {
  return (
    <span
      className={`label shrink-0 ${className}`}
      style={{ color: "var(--ink-3)", transform: "translateY(-0.05em)" }}
    >
      /{n}
    </span>
  );
}
