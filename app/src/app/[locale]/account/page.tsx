'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CenteredShell, PageSection } from '@/components/layout/page-section';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/components/ui/link';
import { cardLayout } from '@/components/ui/styles';
import { AccountField, AccountInput } from '@/components/account/account-field';
import { Alert } from '@/components/ui/alert';
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
import { NotificationToggle, useNotifications } from '@/components/account/notifications';
import {
  DeleteAccountModal,
  DeleteAccountTrigger,
  useDeleteAccount,
} from '@/components/account/delete-account';
import { useAuth } from '@/lib/auth/auth-context';

function SsoRedirect() {
  useEffect(() => {
    window.location.replace('/auth/sso/account');
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center text-text-muted">
      <Loader2 className="size-8 animate-spin" />
    </div>
  );
}

function LocalAccountSettings() {
  const t = useTranslations('Account');
  const tPassword = useTranslations('Password');
  const profile = useProfile();
  const password = usePassword();
  const notifications = useNotifications();
  const deleteAccount = useDeleteAccount();

  return (
    <CenteredShell className="items-start py-10">
      <div className={`${cardLayout.lg} flex flex-col gap-6`}>
        <Alert
          type="warning"
          message={
            t.rich('ssoDeprecation', {
              link: (chunks) => <Link href="/auth/sso/login" unlocalized className="font-medium">{chunks}</Link>,
            })
          }
        />

        <PageSection title={t('profile')}>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <ProfileErrorAlert
                error={profile.error}
                onClose={() => profile.clearError()}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AccountField label={t('firstName')} htmlFor="name">
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
                <AccountField label={t('lastName')} htmlFor="lastName">
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
                <AccountField label={t('email')} className="sm:col-span-2" hint={t('emailHint')}>
                  <AccountInput value={profile.user?.email ?? ''} disabled />
                </AccountField>
                <AccountField label={t('organization')} htmlFor="org" className="sm:col-span-2">
                  <AccountInput
                    id="org"
                    value={profile.organization}
                    onChange={(e) => {
                      profile.setOrganization(e.target.value);
                      profile.clearError();
                      profile.clearSaved();
                    }}
                    placeholder={t('optional')}
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

        <PageSection title={tPassword('section')}>
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{tPassword('changeTitle')}</p>
                  <p className="text-sm text-muted-foreground">{tPassword('changeHint')}</p>
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
                  <AccountField label={tPassword('current')} error={password.errors.current}>
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
                    <AccountField label={tPassword('new')} error={password.errors.new}>
                      <AccountInput
                        type="password"
                        value={password.newPw}
                        onChange={(e) => {
                          password.setNewPw(e.target.value);
                          password.clearError('new');
                        }}
                      />
                    </AccountField>
                    <AccountField label={tPassword('confirm')} error={password.errors.confirm}>
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

        <PageSection title={t('notifications')}>
          <Card>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('serviceNotifications')}</p>
                  <p className="text-sm text-muted-foreground">{t('serviceNotificationsHint')}</p>
                </div>
                <NotificationToggle
                  enabled={notifications.enabled}
                  onToggle={notifications.toggle}
                />
              </div>
            </CardContent>
          </Card>
        </PageSection>

        <PageSection title={t('dangerZone')} titleClassName="text-destructive">
          <Card>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[10px] border border-destructive/20 bg-destructive/5 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('deleteAccount')}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t('deleteAccountHint')}</p>
                </div>
                <DeleteAccountTrigger onClick={() => deleteAccount.setOpen(true)} />
              </div>
            </CardContent>
          </Card>
        </PageSection>

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
  );
}

function AccountPageContent() {
  const { user } = useAuth();
  if (user?.is_sso) return <SsoRedirect />;
  return <LocalAccountSettings />;
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountPageContent />
    </ProtectedRoute>
  );
}
