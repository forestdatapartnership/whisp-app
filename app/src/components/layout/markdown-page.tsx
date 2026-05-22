import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { CenteredShell } from '@/components/layout/page-section';
import { REPO_ROOT } from '@/lib/server/repo-root';

export function MarkdownPage({
  fileName,
  baseDir = 'docs',
}: {
  fileName: string;
  baseDir?: string;
}) {
  const fullPath = path.join(REPO_ROOT, baseDir, fileName);
  const content = fs.readFileSync(fullPath, 'utf-8');

  return (
    <CenteredShell className="items-start py-10">
      <article
        className={[
          'prose prose-sm max-w-3xl w-full',
          'prose-headings:text-text-primary prose-p:text-text-muted prose-li:text-text-muted',
          'prose-strong:text-text-primary prose-a:text-accent-green prose-a:no-underline hover:prose-a:underline',
          'prose-th:border-border prose-td:border-border prose-hr:border-border',
          'dark:prose-invert',
        ].join(' ')}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSlug]}>
          {content}
        </ReactMarkdown>
      </article>
    </CenteredShell>
  );
}
