"use client";

// Fixed operator notices shipped with the build. The `kind` prop only selects
// which of these constant strings renders — the HTML itself is never taken from
// a prop, query string, or API response, so dangerouslySetInnerHTML here only
// ever emits build-time markup.
const NOTICES: Record<string, string> = {
  feed: '<strong>Operations feed</strong>',
  maintenance: '<em>Scheduled maintenance window</em> 02:00–02:30 UTC.',
  rotated: 'Session keys <strong>rotated</strong>. Re-arm the kiosk if needed.',
};

const DEFAULT_KIND = "feed";

interface SystemNoticeProps {
  kind?: string;
  className?: string;
}

export default function SystemNotice({ kind = DEFAULT_KIND, className }: SystemNoticeProps) {
  // Look the message up by kind; an unknown kind falls back to the default
  // constant. `html` is therefore always one of the fixed NOTICES values.
  const html = NOTICES[kind] ?? NOTICES[DEFAULT_KIND];
  return (
    <div
      className={className}
      style={{ color: "var(--ink-3)" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
