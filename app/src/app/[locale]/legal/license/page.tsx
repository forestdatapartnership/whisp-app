import { getTranslations } from 'next-intl/server';
import { MarkdownPage } from '@/components/layout/markdown-page';

export async function generateMetadata() {
  const t = await getTranslations('Footer');
  return { title: `${t('license')} - Whisp` };
}

export default function LicensePage() {
  return <MarkdownPage fileName="LICENSE" baseDir="" />;
}
