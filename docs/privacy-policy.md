# WHISP Privacy Policy

**Last updated:** October 2026

## 1. About This Policy

WHISP ("What is in that plot?") is developed and maintained by the **Forest Data Partnership** under the **Food and Agriculture Organization of the United Nations (FAO)** through the **OpenForis** initiative. As an FAO platform, WHISP is covered by FAO's [Data Protection and Privacy Notice](https://www.fao.org/contact-us/data-protection-and-privacy/en/) and [Data Protection Policy](https://www.fao.org/fileadmin/user_upload/legal/docs/AC2022-06.pdf) rather than any single national or regional legal framework. This policy adds what is specific to WHISP, explaining clearly and honestly what data we collect, how we use it, and the controls we give you over your information. Where the two differ on a data protection matter, FAO's notice prevails. Nothing in this policy waives the privileges and immunities of FAO.

- **Website:** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contact:** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Repository:** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. What Data We Collect

### 2.1 Account Data

WHISP accounts are created through FAO single sign-on (SSO). When you first sign in, FAO's sign-on service confirms your identity and sends WHISP your name, email address and an account identifier. WHISP never receives your SSO password, and your SSO account itself is managed by FAO. Accounts created before SSO, which sign in with a WHISP password ("WHISP-only accounts"), also hold a password and, optionally, an organisation.

| Data | Purpose |
|---|---|
| **SSO account identifier** | Linking your WHISP account to your FAO sign-in |
| **First name, last name** | Account identification |
| **Email address** | Account identification, notifications, password reset for WHISP-only accounts |
| **Password** (WHISP-only accounts) | Authentication (stored as a bcrypt hash, never in plaintext) |
| **Organisation** (WHISP-only accounts, optional) | User profile context |

### 2.2 Technical Data

When you use the WHISP service, we automatically collect:

| Data | Purpose | Retention |
|---|---|---|
| **IP address** | Security, abuse prevention, rate limiting | Anonymised after configurable retention period (default: 90 days) |
| **User agent** | Debugging, compatibility | Log rotation policy |
| **API key** | API access control and rate limiting; one is created automatically when you first sign in | Until revoked or account deleted |

### 2.3 Analysis Data

When you submit geometries for geospatial analysis:

| Data | Purpose |
|---|---|
| **Geometries** (GeoJSON, WKT, or GeoIDs) | Geospatial risk analysis via Google Earth Engine |
| **Analysis options** (technical parameters) | Configuring the analysis run |
| **Analysis job metadata** (timestamps, status, agent type, endpoint) | Service operation, auditing, debugging |

Geometries may be sensitive depending on context (e.g. a farm boundary linked to a person). WHISP's analysis engine processes geometries **without any user-identifying context** — see the [GEE Data Separation Annex](./gee-data-separation) for technical evidence.

### 2.4 Notification Data

| Data | Purpose |
|---|---|
| **Email address** | Service notifications |
| **Subscription status** | Managing notification preferences |

### 2.5 Feedback

| Data | Purpose |
|---|---|
| **Feedback answers** (rating, region, organisation type, free-text answers) | Improving WHISP |

If you are signed in, your feedback is linked to your account. Please do not include personal details in your comments.

## 3. How We Use Your Data

We use your personal data exclusively for:

- **Providing the service** — account management, authentication, API access
- **Running geospatial analyses** — processing your submitted geometries through Google Earth Engine (no personal data is sent to GEE)
- **Service communications** — password reset for WHISP-only accounts, service notifications
- **Security and abuse prevention** — rate limiting, IP-based abuse detection
- **Service improvement** — aggregated, non-identifying usage statistics

We do **not** use your data for:
- Profiling or automated decision-making
- Advertising or marketing to third parties
- Selling or renting to any third party

## 4. Data Retention

| Data Category | Retention Period |
|---|---|
| **Account data** (name, email, SSO identifier; password hash for WHISP-only accounts) | Until you delete your account |
| **IP addresses** in analysis job records | Automatically anonymised after the configured retention period (default: 90 days) |
| **Analysis job metadata** | Retained for service operation; IP addresses within are anonymised per the schedule above |
| **API keys** | Until revoked or account deleted (soft-deleted for audit trail) |
| **Password reset tokens** (WHISP-only accounts) | Valid for 1 hour; revoked after use |
| **Notification subscriptions** | Until you unsubscribe or delete your account |
| **Feedback** | Retained to improve the service; unlinked from your account if you delete it |
| **Application logs** | Subject to infrastructure log rotation policy |

## 5. Third-Party Services and Data Transfers

WHISP interacts with the following third-party services during operation:

| Service | Data Shared | Purpose |
|---|---|---|
| **Google Cloud** | All data WHISP stores (such as accounts, API keys, analysis job records and feedback) | Hosting the application and its database |
| **Google Earth Engine** | Geometries and technical analysis parameters only. **No personal data** (names, emails, IPs, user IDs) is transmitted. | Geospatial computation engine |
| **Asset Registry** | GeoIDs (when using GeoID submission) and, if you sign in with SSO, a short-lived SSO access token | Resolving geographic identifiers to geometry |
| **Google Gmail SMTP** | Recipient email address, email content | Sending password reset emails for WHISP-only accounts |
| **Google Maps API** | Client-side map interactions (subject to Google's privacy policy) | Map visualisation in the UI |

WHISP runs on Google Cloud servers in Europe. For the technical evidence of data separation between WHISP and Google Earth Engine, see the [GEE Data Separation Annex](./gee-data-separation).

## 6. Cookies and Local Storage

WHISP uses the following cookies:

| Cookie | Type | Purpose | Duration |
|---|---|---|---|
| `token` | Strictly necessary | WHISP session (JWT) | 30 minutes |
| `refreshToken` | Strictly necessary | Renewing the WHISP session | 7 days |
| `kc_refresh_token` | Strictly necessary | Keeping your SSO session for GeoID lookups and SSO sign-out | 30 days |
| `sso_state` | Strictly necessary | Protecting the SSO sign-in redirect | 5 minutes |

These cookies are:
- **HttpOnly** — not accessible to client-side JavaScript
- **Secure** — transmitted only over HTTPS (in production)
- **SameSite=Strict** — not sent with cross-site requests, except `sso_state`, which uses SameSite=Lax so it is still sent when FAO's sign-in page redirects you back

WHISP also keeps the following in your browser. They are not sent to WHISP's servers:

| Item | Storage | Purpose |
|---|---|---|
| `whisp-theme` | Local storage | Your light or dark theme choice |
| `whisp-intro-dismissed` | Local storage | Remembering that you closed the introduction |
| `whisp-feedback-prompt-dismissed` | Local storage | Remembering that you answered or closed the feedback prompt |
| `whisp-sync:…` | Session storage | Passing analysis results to the results page; removed once read |
| `whisp-release-v…` | Session storage | Caching the link to the current release notes |
| `whisp` database | IndexedDB | Showing a results file you open from your computer; removed when you return to the submission page |

WHISP does not use any analytics, tracking, or advertising cookies.

## 7. Your Data, Your Control

We believe you should have meaningful control over your personal data. Here is what WHISP provides:

### 7.1 Access Your Data

You can view your personal data at any time on the **Account** page in WHISP. To receive a copy of the personal data we hold about you, make a formal request (see 7.6).

### 7.2 Correct Your Data

If you sign in with SSO, your name and email address come from your FAO account; change them there through **Manage account** on the **Account** page. For WHISP-only accounts, you can update your first name, last name, and organisation on the **Account** page; to change your email address, please contact us.

### 7.3 Delete Your Account

You can permanently delete your account and all associated data on the **Account** page. Account deletion:
- Requires confirmation, plus your password for WHISP-only accounts
- Permanently deletes your user profile, API keys, verification tokens, password reset tokens, and notification subscriptions
- Anonymises associated analysis job records and feedback

Deleting your WHISP account does not delete your SSO account, which is managed by FAO.

### 7.4 Limit Data Processing

You can reduce the data we actively process by revoking your API key, unsubscribing from notifications, or deleting your account entirely. You can also object to the processing of your data through a formal request (see 7.6).

### 7.5 Opt Out of Notifications

You can unsubscribe from service notifications at any time on the **Account** page or by contacting us.

### 7.6 Formal Requests and Concerns

If you have concerns about how your data is handled, we encourage you to contact us directly. We take all data protection concerns seriously and will respond promptly.

You can also make a formal request to access (including a copy), correct, or delete your personal data, or to object to its processing, through FAO's Data Protection Unit: submit it on the [FAO ServiceNow portal](https://fao.service-now.com/csp) and select **Data Privacy**. FAO may need to verify your identity first, and will explain if any part of a request cannot be fulfilled.

## 8. Data Security

We implement the following technical measures to protect your data:

- **FAO single sign-on**, so WHISP never handles your SSO password
- **Password hashing** with bcrypt (salted, one-way hash) for WHISP-only accounts
- **JWT tokens** stored in secure, HttpOnly cookies with SameSite=Strict
- **CORS restrictions** limited to configured allowed origins
- **Rate limiting** on API endpoints and feedback submissions
- **Strong password policy** for WHISP-only accounts (minimum 8 characters with uppercase, lowercase, number, and special character)
- **Automatic PII anonymisation** for IP addresses after the configured retention period
- **Separation by design** between user account data and geospatial analysis processing

If a security incident puts your personal data at significant risk, FAO follows its incident response procedures, which may include informing affected users.

## 9. Children

WHISP is not directed at minors, and we do not knowingly collect personal data from children.

## 10. Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date at the top of this document. Material changes will be communicated through the service.

## 11. Contact

For questions about this privacy policy or your personal data, contact:

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)

For formal data protection requests, use the FAO ServiceNow portal as described in section 7.6.
