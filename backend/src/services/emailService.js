import nodemailer from 'nodemailer';

// Configure the transporter. In production, use your real SMTP credentials.
// If no credentials are provided, we will mock the email sending.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    auth: {
        user: process.env.SMTP_USER || 'mock_user',
        pass: process.env.SMTP_PASS || 'mock_pass'
    }
});

export const sendPaymentReceipt = async (email, paymentDetails) => {
    try {
        const mailOptions = {
            from: '"Club Italia 90" <noreply@italia90.club>',
            to: email,
            subject: `Comprobante de Pago - ${paymentDetails.concept}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #070571; text-align: center;">¡Pago Exitoso!</h2>
                    <p>Hola,</p>
                    <p>Hemos recibido tu pago correctamente. A continuación, los detalles de tu comprobante:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Concepto:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${paymentDetails.concept}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Monto:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">$${paymentDetails.amount}</td>
                        </tr>
                        ${paymentDetails.memberName ? `
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Inscripto:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${paymentDetails.memberName} (DNI: ${paymentDetails.memberDni || 'N/A'})</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Fecha:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleDateString('es-AR')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>ID de Transacción:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${paymentDetails.transactionId}</td>
                        </tr>
                    </table>

                    <p style="margin-top: 30px; font-size: 14px; color: #64748b; text-align: center;">
                        Este es un comprobante automático generado por el sistema del Club Italia 90.
                    </p>
                </div>
            `
        };

        if (!process.env.SMTP_USER) {
            console.log('--- MOCK EMAIL SENDING ---');
            console.log(`To: ${email}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log('--- END MOCK ---');
            return true;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
