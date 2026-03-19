import MarkdownPage from '@/components/layout/MarkdownPage';

export const metadata = {
  title: 'Terms of Service - Whisp',
};

export default function TermsOfServicePage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: 'window.scrollTo(0, 0);'
      }} />
      <MarkdownPage filePath="docs/terms-of-service.md" />
    </>
  );
}
