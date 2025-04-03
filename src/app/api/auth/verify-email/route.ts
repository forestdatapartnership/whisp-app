import nodemailer from "nodemailer";

export async function sendVerificationEmail(email: string, token: string) {
	const transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS, // App password
		},
	});

	const verificationUrl = `${process.env.HOST_URL}/api/auth/verify-email?token=${token}`;

	await transporter.sendMail({
		from: '"Whisp" <whisp.openforis@gmail.com>',
		to: email,
		subject: "Verify your email address for Whisp",
		html: `
			<div style="font-family: sans-serif; padding: 20px;">
				<h2>Welcome to Whisp 👋</h2>
				<p>We're excited to have you on board.</p>
				<p>To get started, please verify your email address by clicking the button below:</p>
				<p>
					<a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px;">
						Verify Email
					</a>
				</p>
				<p>If the button doesn’t work, you can also copy and paste this URL into your browser:</p>
				<p><a href="${verificationUrl}">${verificationUrl}</a></p>
				<p style="margin-top: 30px;">Thanks,<br/>The Whisp Team</p>
			</div>
		`,
	});
}

