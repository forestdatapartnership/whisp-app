# WHISP Privacy Policy

**Last updated:** March 2026

## 1. About This Policy

WHISP ("What is in that plot?") is developed and maintained by the **Forest Data Partnership** under the **Food and Agriculture Organization of the United Nations (FAO)** through the **OpenForis** initiative. As a UN programme, WHISP operates under FAO's internal data protection principles rather than any single national or regional legal framework. This policy explains clearly and honestly what data we collect, how we use it, and the controls we give you over your information.

- **Website:** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contact:** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Repository:** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. What Data We Collect

### 2.1 Account Data

When you register for a WHISP account, we collect:

| Data | Purpose |
|---|---|
| **First name, last name** | Account identification |
| **Email address** | Authentication, account verification, password reset, notifications |
| **Password** | Authentication (stored as a bcrypt hash, never in plaintext) |
| **Organisation** (optional) | User profile context |

### 2.2 Technical Data

When you use the WHISP service, we automatically collect:

| Data | Purpose | Retention |
|---|---|---|
| **IP address** | Security, abuse prevention, rate limiting | Anonymised after configurable retention period (default: 90 days) |
| **User agent** | Debugging, compatibility | Log rotation policy |
| **API key** | API access control and rate limiting | Until revoked or account deleted |

### 2.3 Analysis Data

When you submit geometries for geospatial analysis:

| Data | Purpose |
|---|---|
| **Geometries** (GeoJSON, WKT, or GeoIDs) | Geospatial risk analysis via Google Earth Engine |
| **Analysis options** (technical parameters) | Configuring the analysis run |
| **Analysis job metadata** (timestamps, status, agent type, endpoint) | Service operation, auditing, debugging |

Geometries may be sensitive depending on context (e.g. a farm boundary linked to a person). WHISP's analysis engine processes geometries **without any user-identifying context** — see the [GEE Data Separation Annex](/gee-data-separation) for technical evidence.

### 2.4 Notification Data

| Data | Purpose |
|---|---|
| **Email address** | Service notifications |
| **Subscription status** | Managing notification preferences |

## 3. How We Use Your Data

We use your personal data exclusively for:

- **Providing the service** — account management, authentication, API access
- **Running geospatial analyses** — processing your submitted geometries through Google Earth Engine (no personal data is sent to GEE)
- **Service communications** — email verification, password reset, service notifications
- **Security and abuse prevention** — rate limiting, IP-based abuse detection
- **Service improvement** — aggregated, non-identifying usage statistics

We do **not** use your data for:
- Profiling or automated decision-making
- Advertising or marketing to third parties
- Selling or renting to any third party

## 4. Data Retention

| Data Category | Retention Period |
|---|---|
| **Account data** (name, email, password hash) | Until you delete your account |
| **IP addresses** in analysis job records | Automatically anonymised after the configured retention period (default: 90 days) |
| **Analysis job metadata** | Retained for service operation; IP addresses within are anonymised per the schedule above |
| **API keys** | Until revoked or account deleted (soft-deleted for audit trail) |
| **Email verification / password reset tokens** | Valid for 1 hour; revoked after use |
| **Notification subscriptions** | Until you unsubscribe or delete your account |
| **Application logs** | Subject to infrastructure log rotation policy |

## 5. Third-Party Services and Data Transfers

WHISP interacts with the following third-party services during operation:

| Service | Data Shared | Purpose |
|---|---|---|
| **Google Earth Engine** | Geometries and technical analysis parameters only. **No personal data** (names, emails, IPs, user IDs) is transmitted. | Geospatial computation engine |
| **Asset Registry (AgStack)** | Geometries in WKT/GeoJSON format (when using GeoID features) | Resolving or registering geographic identifiers |
| **Google Gmail SMTP** | Recipient email address, email content | Sending verification and password reset emails |
| **Google Maps API** | Client-side map interactions (subject to Google's privacy policy) | Map visualisation in the UI |

For the technical evidence of data separation between WHISP and Google Earth Engine, see the [GEE Data Separation Annex](/gee-data-separation).

## 6. Cookies and Local Storage

WHISP uses the following cookies:

| Cookie | Type | Purpose | Duration |
|---|---|---|---|
| `access_token` | Strictly necessary | JWT authentication token | 30 minutes |
| `refresh_token` | Strictly necessary | JWT token refresh | 7 days |

These cookies are:
- **HttpOnly** — not accessible to client-side JavaScript
- **Secure** — transmitted only over HTTPS (in production)
- **SameSite=Strict** — not sent with cross-site requests

WHISP does not use any analytics, tracking, or advertising cookies.

## 7. Your Data, Your Control

We believe you should have meaningful control over your personal data. Here is what WHISP provides:

### 7.1 Access Your Data

You can view your personal data at any time through the **Settings** page in your WHISP account.

### 7.2 Correct Your Data

You can update your first name, last name, and organisation through the **Settings** page. To change your email address, please contact us.

### 7.3 Delete Your Account

You can permanently delete your account and all associated data through the **Settings** page. Account deletion:
- Requires password confirmation
- Permanently deletes your user profile, API keys, verification tokens, and password reset tokens
- Anonymises associated analysis job records

### 7.4 Limit Data Processing

You can reduce the data we actively process by revoking your API key, unsubscribing from notifications, or deleting your account entirely.

### 7.5 Opt Out of Notifications

You can unsubscribe from service notifications at any time via the **Settings** page or by contacting us.

### 7.6 Raise a Concern

If you have concerns about how your data is handled, we encourage you to contact us directly. We take all data protection concerns seriously and will respond promptly.

## 8. Data Security

We implement the following technical measures to protect your data:

- **Password hashing** with bcrypt (salted, one-way hash)
- **JWT tokens** stored in secure, HttpOnly cookies with SameSite=Strict
- **CORS restrictions** limited to configured allowed origins
- **Rate limiting** on registration and API endpoints
- **Strong password policy** (minimum 8 characters with uppercase, lowercase, number, and special character)
- **Automatic PII anonymisation** for IP addresses after the configured retention period
- **Separation by design** between user account data and geospatial analysis processing

## 9. Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date at the top of this document. Material changes will be communicated through the service.

## 10. Contact

For questions about this privacy policy or your personal data, contact:

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)
