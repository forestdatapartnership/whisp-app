import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, token: string) {
	const transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS, // App password
		},
	});

	// Make sure HOST_URL is defined, with a fallback to localhost
	const hostUrl = process.env.HOST_URL || 'http://localhost:3000';
	// Ensure there's no trailing slash in the host URL
	const baseUrl = hostUrl.endsWith('/') ? hostUrl.slice(0, -1) : hostUrl;
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
