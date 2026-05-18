import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: "dmitriitalent@gmail.com",
		pass: "zvpgywekgiexntyp",
	},
});

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
	await transporter.sendMail({
		from: '"Hostelite.ru" <dmitriitalent@gmail.com>',
		to,
		subject: "Код верификации Hostelite",
		html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
<h2 style="color:#333">Hostelite — подтверждение регистрации</h2>
<p style="color:#555">Ваш код верификации:</p>
<div style="font-size:36px;font-weight:bold;letter-spacing:8px;background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:16px 0">${code}</div>
<p style="color:#777;font-size:14px">Код действителен 20 минут.</p>
<p style="color:#777;font-size:14px">Если вы не запрашивали регистрацию — проигнорируйте это письмо.</p>
</div>`,
	});
}
