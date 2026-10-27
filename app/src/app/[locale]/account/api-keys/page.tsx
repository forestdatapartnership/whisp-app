'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CenteredShell, PageSection } from '@/components/layout/page-section';
import { Card, CardContent } from '@/components/ui/card';
import { linkVariants } from '@/components/ui/link';
import { cardLayout } from '@/components/ui/styles';
import { ApiQuickStart } from '@/components/account/api-quick-start';
import { FeedbackDialog } from '@/components/feedback/feedback-dialog';
import {
  ApiKeyConfirmModals,
  ApiKeyDisplay,
  ApiKeyEmptyState,
  ApiKeyErrorAlert,
  ApiKeyLoading,
  ApiKeyRevealBanner,
  useAccountApiKey,
} from '@/components/account/api-key';
import { maskApiKey } from '@/lib/account/api-key-utils';

export default function ApiKeysPage() {
  const t = useTranslations('ApiKey');
  const apiKey = useAccountApiKey();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const displayKey =
    apiKey.revealed ?? (apiKey.apiKey ? maskApiKey(apiKey.apiKey) : '');

  return (
    <ProtectedRoute>
      <CenteredShell className="items-start py-10">
        <div className={`${cardLayout.lg} flex flex-col gap-6`}>
          <PageSection title={t('title')}>
            <Card>
              <CardContent className="flex flex-col gap-4">
                <ApiKeyErrorAlert message={apiKey.error ?? undefined} onClose={apiKey.clearError} />
                {apiKey.isLoading ? (
                  <ApiKeyLoading />
                ) : apiKey.hasApiKey || apiKey.revealed ? (
                  <>
                    <ApiKeyDisplay
                      displayKey={displayKey}
                      createdAt={apiKey.apiKeyMetadata?.createdAt ?? undefined}
                      busy={apiKey.busy}
                      onRegenerate={() => apiKey.setRegenOpen(true)}
                      onRevoke={() => apiKey.setRevokeOpen(true)}
                    />
                    {apiKey.revealed && (
                      <div className="flex flex-col gap-2.5 rounded-lg border border-accent-green/20 bg-accent-green/5 p-4">
                        <ApiKeyRevealBanner apiKey={apiKey.revealed} />
                      </div>
                    )}
                    {apiKey.apiBase && (
                      <ApiQuickStart apiBase={apiKey.apiBase} className="mt-3" />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <ApiKeyEmptyState busy={apiKey.busy} onGenerate={apiKey.handleRegen} />
                  </div>
                )}
              </CardContent>
            </Card>
          </PageSection>

          <p className="text-sm text-text-muted">
            {t.rich('feedbackPrompt', {
              link: (chunks) => (
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className={`cursor-pointer transition-colors ${linkVariants.accent}`}
                >
                  {chunks}
                </button>
              ),
            })}
          </p>
          <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

          <ApiKeyConfirmModals
            regenOpen={apiKey.regenOpen}
            revokeOpen={apiKey.revokeOpen}
            onCloseRegen={() => apiKey.setRegenOpen(false)}
            onCloseRevoke={() => apiKey.setRevokeOpen(false)}
            onRegen={apiKey.handleRegen}
            onRevoke={apiKey.handleRevoke}
          />
        </div>
      </CenteredShell>
    </ProtectedRoute>
  );
}
