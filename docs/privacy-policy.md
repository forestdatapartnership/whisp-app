# WHISP Privacy Policy

**Last updated:** March 2025

## 1. Data Controller

WHISP ("What is in that plot?") is developed and maintained by the **Forest Data Partnership** under the **Food and Agriculture Organization of the United Nations (FAO)** through the **OpenForis** initiative.

- **Website:** [https://whisp.openforis.org](https://whisp.openforis.org)
- **Contact:** [Open-Foris@fao.org](mailto:Open-Foris@fao.org)
- **Repository:** [https://github.com/forestdatapartnership/whisp-app](https://github.com/forestdatapartnership/whisp-app)

## 2. What Data We Collect

### 2.1 Account Data

When you register for a WHISP account, we collect:

| Data | Purpose | Lawful Basis |
|---|---|---|
| **First name, last name** | Account identification | Contractual necessity (Art. 6(1)(b)) |
| **Email address** | Authentication, account verification, password reset, notifications | Contractual necessity (Art. 6(1)(b)) |
| **Password** | Authentication (stored as a bcrypt hash, never in plaintext) | Contractual necessity (Art. 6(1)(b)) |
| **Organisation** (optional) | User profile context | Consent (Art. 6(1)(a)) |

### 2.2 Technical Data

When you use the WHISP service, we automatically collect:

| Data | Purpose | Lawful Basis | Retention |
|---|---|---|---|
| **IP address** | Security, abuse prevention, rate limiting | Legitimate interest (Art. 6(1)(f)) | Anonymised after configurable retention period (default: 90 days) |
| **User agent** | Debugging, compatibility | Legitimate interest (Art. 6(1)(f)) | Log rotation policy |
| **API key** | API access control and rate limiting | Contractual necessity (Art. 6(1)(b)) | Until revoked or account deleted |

### 2.3 Analysis Data

When you submit geometries for geospatial analysis:

| Data | Purpose | Lawful Basis |
|---|---|---|
| **Geometries** (GeoJSON, WKT, or GeoIDs) | Geospatial risk analysis via Google Earth Engine | Contractual necessity (Art. 6(1)(b)) |
| **Analysis options** (technical parameters) | Configuring the analysis run | Contractual necessity (Art. 6(1)(b)) |
| **Analysis job metadata** (timestamps, status, agent type, endpoint) | Service operation, auditing, debugging | Legitimate interest (Art. 6(1)(f)) |

Geometries may be sensitive depending on context (e.g. a farm boundary linked to a person). However, WHISP's analysis engine processes geometries **without any user-identifying context** — see the [GEE Data Separation Annex](/gee-data-separation) for technical evidence.

### 2.4 Notification Data

| Data | Purpose | Lawful Basis |
|---|---|---|
| **Email address** | Service notifications | Legitimate interest (Art. 6(1)(f)) |
| **Subscription status** | Managing notification preferences | Legitimate interest (Art. 6(1)(f)) |

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

## 7. Your Rights Under GDPR

You have the following rights regarding your personal data:

### 7.1 Right of Access (Art. 15)

You can view your personal data at any time through the **Settings** page in your WHISP account.

### 7.2 Right to Rectification (Art. 16)

You can update your name, last name, and organisation through the **Settings** page. To change your email address, please contact the data controller.

### 7.3 Right to Erasure (Art. 17)

You can delete your account and all associated data through the **Settings** page. Account deletion:
- Requires password confirmation
- Permanently deletes your user profile, API keys, verification tokens, and password reset tokens
- Anonymises associated analysis job records

### 7.4 Right to Restrict Processing (Art. 18)

You can restrict processing by revoking your API key, unsubscribing from notifications, or deleting your account.

### 7.5 Right to Object (Art. 21)

You may object to processing based on legitimate interest by contacting the data controller. You can unsubscribe from notifications at any time.

### 7.6 Right to Lodge a Complaint

You have the right to lodge a complaint with a supervisory authority if you believe your data protection rights have been violated.

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

For questions about this privacy policy or to exercise your data protection rights, contact:

[Open-Foris@fao.org](mailto:Open-Foris@fao.org)
