const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

// Configuración del transporte de correo electrónico
exports.setupEmail = () => {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Función para enviar correos electrónicos
exports.sendEmail = (formData, pdfBuffer) => {
    return new Promise((resolve, reject) => {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: formData.correo,
            subject: 'Autorización de Solped Requerida',
            html: generateHtmlContent(formData),
            attachments: [
                {
                    filename: 'Formulario-Autorizado.pdf',
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                },
                {
                    filename: 'LOGO BCL H.png',
                    path: path.join(__dirname, "../public/img/LOGO BCL H.png"),
                    cid: 'logoBCLH' // Este CID se usa en el src del img tag en el HTML
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar correo:', error);
                reject(error);
            } else {
                console.log('Correo enviado:', info.response);
                resolve(info);
            }
        });
    });
};

// Función para generar el contenido HTML del correo
function generateHtmlContent(formData) {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
                .email-container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                .header { text-align: left; border-bottom: 2px solid #005687; padding-bottom: 10px; margin-bottom: 20px; }
                .email-content { text-align: left; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 10px; font-size: 0.8em; color: #888; }
                .button { padding: 10px 20px; margin: 10px 5px; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; }
                .authorize { background-color: #28a745; }
                .decline { background-color: #dc3545; }
                .button-container { text-align: center; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img src="cid:logoBCLH" alt="Logo" style="max-width: 150px;">
                </div>
                <div class="email-content">
                    <p>Estimado/a ${formData.correo},</p>
                    <p>Por favor, autorice el gasto de <strong>${formData.productService}</strong>, por un monto de <strong>${formData.expenseAmount}</strong> correspondiente a la partida presupuestal <strong>${formData.budgetItem}</strong>. Encuentra los detalles adjuntos. Gracias.</p>
                    <p>Saludos cordiales,<br>${formData.applicant}</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático, por favor no responder directamente.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
