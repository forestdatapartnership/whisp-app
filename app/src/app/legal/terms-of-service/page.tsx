import { MarkdownPage } from '@/components/layout/markdown-page';

export const metadata = {
  title: 'Terms of Use - Whisp',
};

export default function TermsOfServicePage() {
  return <MarkdownPage fileName="terms-of-service.md" />;
}
