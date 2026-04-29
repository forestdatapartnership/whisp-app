export type UserProfile = {
  uuid: string;
  name: string;
  last_name: string;
  organization: string | null;
  email: string;
  email_verified: boolean;
  is_admin: boolean;
};
