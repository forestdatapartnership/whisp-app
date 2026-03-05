import MarkdownPage from '@/components/MarkdownPage';

export const metadata = {
  title: 'Terms of Service - Whisp',
};

export default function TermsOfServicePage() {
  return <MarkdownPage filePath="docs/terms-of-service.md" />;
}
