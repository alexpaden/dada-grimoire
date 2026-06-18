import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

export function renderNotice(source: string): string {
  return md.render(source ?? "");
}
