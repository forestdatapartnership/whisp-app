import { getTranslations } from 'next-intl/server';
import { MarkdownPage } from '@/components/layout/markdown-page';

export async function generateMetadata() {
  const t = await getTranslations('Footer');
  return { title: `${t('geeDataSeparation')} - Whisp` };
}

export default function GeeDataSeparationPage() {
  return <MarkdownPage fileName="gee-data-separation.md" />;
}
