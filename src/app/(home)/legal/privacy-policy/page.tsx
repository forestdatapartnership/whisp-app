import MarkdownPage from '@/components/MarkdownPage';

export const metadata = {
  title: 'Privacy Policy - Whisp',
};

export default function PrivacyPolicyPage() {
  return <MarkdownPage filePath="docs/privacy-policy.md" />;
}
