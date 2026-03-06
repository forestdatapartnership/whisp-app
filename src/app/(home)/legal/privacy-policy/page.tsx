import MarkdownPage from '@/components/MarkdownPage';

export const metadata = {
  title: 'Privacy Policy - Whisp',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: 'window.scrollTo(0, 0);'
      }} />
      <MarkdownPage filePath="docs/privacy-policy.md" />
    </>
  );
}
