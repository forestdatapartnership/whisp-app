import { getTranslations } from 'next-intl/server';
import { FeedbackForm } from '@/components/feedback/feedback-form';

export async function generateMetadata() {
  const t = await getTranslations('Footer');
  return { title: `${t('feedback')} - Whisp` };
}

export default function FeedbackPage() {
  return <FeedbackForm />;
}
