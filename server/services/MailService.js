const nodemailer = require('nodemailer');

class MailService {
    constructor(){
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true, 
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendActivationMail(to, link){
        await this.transporter.sendMail({
            from: `"Afisha App" <${process.env.SMTP_USER}>`,
            to,
            subject: 'Активация аккаунта',
            text: '',
            html: `
                <div>
                    <h1>Привет!</h1>
                    <p>Пожалуйста, активируйте вашу учетную запись, используя следующую ссылку: <a href="${link}">активировать</a>.</p>
                </div>
            `
        });
    }
}

module.exports = new MailService();
