import { getTranslations } from 'next-intl/server';
import { MarkdownPage } from '@/components/layout/markdown-page';

export async function generateMetadata() {
  const t = await getTranslations('Footer');
  return { title: `${t('termsOfUse')} - Whisp` };
}

export default function TermsOfServicePage() {
  return <MarkdownPage fileName="terms-of-service.md" />;
}
