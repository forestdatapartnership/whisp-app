'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { CenteredShell, PageSection } from '@/components/layout/page-section';
import { Card, CardContent } from '@/components/ui/card';
import { AccountField, AccountInput } from '@/components/account/account-field';
import { Alert } from '@/components/ui/alert';
import { ApiQuickStart } from '@/components/account/api-quick-start';
import {
  ProfileErrorAlert,
  ProfileSaveButton,
  useProfile,
} from '@/components/account/profile';
import {
  PasswordChangeToggle,
  PasswordRulesList,
  PasswordUpdateButton,
  usePassword,
} from '@/components/account/password';
import {
  ApiKeyConfirmModals,
  ApiKeyDisplay,
  ApiKeyEmptyState,
  ApiKeyErrorAlert,
  ApiKeyLoading,
  ApiKeyRevealBanner,
  useAccountApiKey,
} from '@/components/account/api-key';
import { NotificationToggle, useNotifications } from '@/components/account/notifications';
import {
  DeleteAccountModal,
  DeleteAccountTrigger,
  useDeleteAccount,
} from '@/components/account/delete-account';
import { maskApiKey } from '@/lib/account/api-key-utils';

export default function SettingsPage() {
  const profile = useProfile();
  const password = usePassword();
  const apiKey = useAccountApiKey();
  const notifications = useNotifications();
  const deleteAccount = useDeleteAccount();

  const displayKey =
    apiKey.revealed ?? (apiKey.apiKey ? maskApiKey(apiKey.apiKey) : '');

  return (
    <ProtectedRoute>
      <CenteredShell className="items-start py-10">
        <div className="w-full max-w-[640px] flex flex-col gap-6">
          <PageSection title="Profile">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <ProfileErrorAlert
                  error={profile.error}
                  onClose={() => profile.clearError()}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AccountField label="First name" htmlFor="name">
                    <AccountInput
                      id="name"
                      value={profile.name}
                      onChange={(e) => {
                        profile.setName(e.target.value);
                        profile.clearError();
                        profile.clearSaved();
                      }}
                    />
                  </AccountField>
                  <AccountField label="Last name" htmlFor="lastName">
                    <AccountInput
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => {
                        profile.setLastName(e.target.value);
                        profile.clearError();
                        profile.clearSaved();
                      }}
                    />
                  </AccountField>
                  <AccountField label="Email" className="sm:col-span-2" hint="Cannot be changed">
                    <AccountInput value={profile.user?.email ?? ''} disabled />
                  </AccountField>
                  <AccountField label="Organization" htmlFor="org" className="sm:col-span-2">
                    <AccountInput
                      id="org"
                      value={profile.organization}
                      onChange={(e) => {
                        profile.setOrganization(e.target.value);
                        profile.clearError();
                        profile.clearSaved();
                      }}
                      placeholder="Optional"
                    />
                  </AccountField>
                </div>
                <div className="flex justify-end">
                  <ProfileSaveButton
                    onSave={profile.save}
                    busy={profile.busy}
                    disabled={!profile.isDirty}
                    saved={profile.saved}
                  />
                </div>
              </CardContent>
            </Card>
          </PageSection>

          <PageSection title="Password">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Change password</p>
                    <p className="text-sm text-muted-foreground">
                      Use a strong password you don&apos;t use elsewhere
                    </p>
                  </div>
                  <PasswordChangeToggle open={password.open} onToggle={password.toggleOpen} />
                </div>
                {password.open && (
                  <div className="flex flex-col gap-4 border-t border-border pt-5">
                    {password.errors.general && (
                      <Alert
                        type="error"
                        message={password.errors.general}
                        onClose={() => password.clearError('general')}
                      />
                    )}
                    <AccountField label="Current password" error={password.errors.current}>
                      <AccountInput
                        type="password"
                        value={password.currentPw}
                        onChange={(e) => {
                          password.setCurrentPw(e.target.value);
                          password.clearError('current');
                        }}
                      />
                    </AccountField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AccountField label="New password" error={password.errors.new}>
                        <AccountInput
                          type="password"
                          value={password.newPw}
                          onChange={(e) => {
                            password.setNewPw(e.target.value);
                            password.clearError('new');
                          }}
                        />
                      </AccountField>
                      <AccountField label="Confirm password" error={password.errors.confirm}>
                        <AccountInput
                          type="password"
                          value={password.confirmPw}
                          onChange={(e) => {
                            password.setConfirmPw(e.target.value);
                            password.clearError('confirm');
                          }}
                        />
                      </AccountField>
                    </div>
                    <PasswordRulesList />
                    <div className="flex justify-end">
                      <PasswordUpdateButton onSave={password.save} busy={password.busy} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PageSection>

          <PageSection title="API Key">
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

          <PageSection title="Notifications">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Service notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Email when the Whisp service has important updates
                    </p>
                  </div>
                  <NotificationToggle
                    enabled={notifications.enabled}
                    onToggle={notifications.toggle}
                  />
                </div>
              </CardContent>
            </Card>
          </PageSection>

          <PageSection title="Danger zone" titleClassName="text-destructive">
            <Card>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[10px] border border-destructive/20 bg-destructive/5 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Delete account</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Permanently removes your account and associated data. Cannot be undone.
                    </p>
                  </div>
                  <DeleteAccountTrigger onClick={() => deleteAccount.setOpen(true)} />
                </div>
              </CardContent>
            </Card>
          </PageSection>

          <ApiKeyConfirmModals
            regenOpen={apiKey.regenOpen}
            revokeOpen={apiKey.revokeOpen}
            onCloseRegen={() => apiKey.setRegenOpen(false)}
            onCloseRevoke={() => apiKey.setRevokeOpen(false)}
            onRegen={apiKey.handleRegen}
            onRevoke={apiKey.handleRevoke}
          />
          <DeleteAccountModal
            open={deleteAccount.open}
            onClose={deleteAccount.close}
            onConfirm={deleteAccount.confirmDelete}
            errors={deleteAccount.errors}
            password={deleteAccount.password}
            setPassword={deleteAccount.setPassword}
            confirmText={deleteAccount.confirmText}
            setConfirmText={deleteAccount.setConfirmText}
            clearError={deleteAccount.clearError}
            busy={deleteAccount.busy}
          />
        </div>
      </CenteredShell>
    </ProtectedRoute>
  );
}
