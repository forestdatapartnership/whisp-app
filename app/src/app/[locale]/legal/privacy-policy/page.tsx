import { getTranslations } from 'next-intl/server';
import { MarkdownPage } from '@/components/layout/markdown-page';

export async function generateMetadata() {
  const t = await getTranslations('Footer');
  return { title: `${t('privacyPolicy')} - Whisp` };
}

export default function PrivacyPolicyPage() {
  return <MarkdownPage fileName="privacy-policy.md" />;
}
