import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import fs from 'fs';
import path from 'path';

interface MarkdownPageProps {
  filePath: string;
}

export default function MarkdownPage({ filePath }: MarkdownPageProps) {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-4xl mx-auto rounded-lg shadow-md p-6 prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-blue-400 prose-table:text-gray-300 prose-th:text-white prose-td:text-gray-300 prose-th:border-gray-600 prose-td:border-gray-700 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSlug]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
