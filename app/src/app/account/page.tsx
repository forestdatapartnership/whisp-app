'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { CenteredShell, PageSection } from '@/components/layout/page-section';
import { Card, CardContent } from '@/components/ui/card';
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
            <>
              Local sign-in is deprecated. <a href="/auth/sso/login" className="font-medium underline underline-offset-2">Sign in with SSO</a> using
              this same email address to switch — your account and API keys carry over automatically, nothing is lost.
            </>
          }
        />

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
