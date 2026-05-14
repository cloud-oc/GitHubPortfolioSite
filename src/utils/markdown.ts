export function normalizeMarkdownImagePath(markdown: string) {
  return markdown.replaceAll("](content/", "](./content/");
}
