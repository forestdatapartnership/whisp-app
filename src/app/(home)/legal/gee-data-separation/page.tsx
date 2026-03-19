import MarkdownPage from '@/components/layout/MarkdownPage';

export const metadata = {
  title: 'GEE Data Separation - Whisp',
};

export default function GeeDataSeparationPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: 'window.scrollTo(0, 0);'
      }} />
      <MarkdownPage filePath="docs/gee-data-separation.md" />
    </>
  );
}
