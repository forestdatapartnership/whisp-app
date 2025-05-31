import nodemailer from "nodemailer";

// Host URL for email assets
const getHostUrl = (): string => {
	const hostUrl = process.env.HOST_URL?.trim() || '';
	return hostUrl.replace(/\/+$/, ''); // Remove trailing slashes
};

const getEmailHeader = (): string => {
	const baseUrl = getHostUrl();
	const logoUrl = `${baseUrl}/whisp_logo.svg`;

	return `
		<div style="text-align: center; margin-bottom: 20px;">
			<img src="${logoUrl}" alt="Whisp Logo" style="width: 100px; height: auto;" />
		</div>
	`;
};

export async function sendVerificationEmail(email: string, token: string) {
	const transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS, // App password
		},
	});

	// Make sure HOST_URL is defined, with a fallback to localhost
	const baseUrl = getHostUrl();
	// Construct the verification URL with proper encoding of the token
	const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

	await transporter.sendMail({
		from: '"Whisp" <whisp.openforis@gmail.com>',
		to: email,
		subject: "Verify your email address for Whisp",
		html: `
			<html>
			<head>
				<style>
					body {
						font-family: sans-serif;
						background-color: #ffffff;
						color: #000000;
						padding: 20px;
					}
					.button {
						display: inline-block;
						padding: 10px 20px;
						background-color: #4f46e5;
						color: white !important;
						text-decoration: none;
						border-radius: 6px;
                        font-weight: bold;
					}
                    a {
                        color: #4f46e5;
                        text-decoration: none;
                    }
					@media (prefers-color-scheme: dark) {
						body {
							background-color: #1a1a1a;
							color: #e0e0e0;
							}
                        a {
                            color: #818cf8;
                        }
					}
				</style>
			</head>
			<body>
				${getEmailHeader()}
				<h2>Welcome to Whisp 👋</h2>
				<p>We're excited to have you on board.</p>
				<p>Please verify your email address by clicking the button below:</p>
				<p>
					<a href="${verificationUrl}" class="button" target="_blank" rel="noopener noreferrer">Verify Email</a>
				</p>
				<p>If the button doesn't work, copy and paste this link into your browser:</p>
				<p><a href="${verificationUrl}" target="_blank" rel="noopener noreferrer">${verificationUrl}</a></p>
				<p style="margin-top: 30px;">Thanks,<br/>The Whisp Team</p>
			</body>
			</html>
		`,
	});
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS, // App password
		},
	});

	// Make sure HOST_URL is defined, with a fallback to localhost
	const baseUrl = getHostUrl();
	// Construct the reset password URL with proper encoding of the token
	const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

	await transporter.sendMail({
		from: '"Whisp" <whisp.openforis@gmail.com>',
		to: email,
		subject: "Reset your password for Whisp",
		html: `
			<html>
			<head>
				<style>
					body {
						font-family: sans-serif;
						background-color: #ffffff;
						color: #000000;
						padding: 20px;
					}
					.button {
						display: inline-block;
						padding: 10px 20px;
						background-color: #4f46e5;
						color: white !important;
						text-decoration: none;
						border-radius: 6px;
                        font-weight: bold;
					}
                    a {
                        color: #4f46e5;
                        text-decoration: none;
                    }
					@media (prefers-color-scheme: dark) {
						body {
							background-color: #1a1a1a;
							color: #e0e0e0;
							}
                        a {
                            color: #818cf8;
                        }
					}
				</style>
			</head>
			<body>
				${getEmailHeader()}
				<h2>Password Reset Request</h2>
				<p>You've requested to reset your password for your Whisp account.</p>
				<p>Click the button below to set a new password:</p>
				<p>
					<a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">Reset Password</a>
				</p>
				<p>If the button doesn't work, copy and paste this link into your browser:</p>
				<p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a></p>
				<p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
				<p style="margin-top: 30px;">Thanks,<br/>The Whisp Team</p>
			</body>
			</html>
		`,
	});
}
