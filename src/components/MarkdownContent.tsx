import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { normalizeMarkdownImagePath } from "../utils/markdown";

export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {normalizeMarkdownImagePath(markdown)}
      </ReactMarkdown>
    </div>
  );
}
