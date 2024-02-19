const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;
require('dotenv').config();
const cors = require('cors');
const { authenticate, getArgs } = require('./jwtConsole'); // Ajusta las rutas según tu estructura de archivos
const { sendEnvelope } =  require('../formulario/lib/eSignature/examples/signingViaEmail');
const jwtModule = require('./jwtConfig');
console.log(jwtModule);
app.use(cors());
app.use(express.json()); // para parsing application/json


app.post('/enviar-formulario', async (req, res) => {
    const { firma, correo, applicant, area, productService, quantity, credit, expenseAmount, provider, budgetItem, paymentForm, description, date, folio } = req.body;

    // Crear un documento PDF
    const doc = new PDFDocument();
    const pdfPath = `firma-${Date.now()}.pdf`;
    const stream = fs.createWriteStream(pdfPath);

    // Define constants for layout
    const margin = 50;
    const pageWidth = doc.page.width - 2 * margin;
    const lineHeight = 14;
    const imagePath = './img/LOGO BCL H.png'; // Asegúrate de que la ruta a la imagen sea correcta
    doc.image(imagePath, margin, 40, { width: 150 }) // Ajusta la posición y el tamaño según sea necesario

    // Mover la posición vertical para el título debajo de la imagen del logo
    let yPos = 120; // Esto coloca el título justo debajo de la imagen del logo
    

    
    // Title of the form
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Formato de Requisición', margin, yPos - 30, { align: 'center' });
    
    // Agregar el número de folio y la fecha a la derecha de la cabecera
    doc.fontSize(10)
       .font('Helvetica')
       .text(`# Folio: ${folio}`, pageWidth + margin - 150, yPos - 30, { width: 140, align: 'right' })
       .text(`Fecha: ${date}`, pageWidth + margin - 150, yPos - 15, { width: 140, align: 'right' });
    
    // Mover la posición vertical para el cuerpo del formulario
    yPos += 50;
    

    // Función para añadir campos de formulario
    function addFormField(label, value, y, xOffset = 150) {
        const fieldHeight = 15; // Altura del campo de texto
        const fieldPadding = 2; // Espacio adicional para que el texto no toque los bordes del rectángulo
        const valueWidth = pageWidth - (margin + xOffset);
        
        // Dibujar el rectángulo de fondo para el valor
        doc.rect(margin + xOffset, y + fieldPadding, valueWidth, fieldHeight)
           .fillOpacity(0.5) // Puedes ajustar la opacidad según necesites
           .fillAndStroke('grey', 'grey'); // El relleno y el borde del rectángulo
    
        // Resetear la opacidad para el texto
        doc.fillOpacity(1);
    
        // Imprime el título
        doc.font('Helvetica').fontSize(10).fillColor('black');
        doc.text(label, margin, y, { width: 240, align: 'left' });
    
        // Imprime el valor con un poco de padding dentro del rectángulo
        doc.text(value || '', margin + xOffset + fieldPadding, y + fieldPadding, { width: valueWidth - (2 * fieldPadding), align: 'left' });
    
        yPos += fieldHeight + (2 * fieldPadding); // Añadir espacio vertical después de cada campo
    }
    // Añadir los campos de formulario
    addFormField('Solicitante (Operador):', applicant, yPos);
    addFormField('Área:', area, yPos);
    addFormField('Producto o Servicio:', productService, yPos);
    addFormField('Cantidad:', quantity.toString(), yPos);
    addFormField('Proveedor:', provider, yPos);
    addFormField('Descripción / Observaciones de Producto o Servicio:', description, yPos, 250);
    addFormField('Monto de Gasto (Pesos / sin iva):', expenseAmount.toString(), yPos, 175);
    addFormField('Forma de Pago:', paymentForm, yPos);
    addFormField('Días de crédito:', credit.toString(), yPos);
    addFormField('Rubro Presupuestal:', budgetItem, yPos);

    // Add extra space for the last field before signatures
    yPos += lineHeight * 2;

    // Signature of the Applicant
    const signatureWidth = 180;
    const signatureHeight = 30; // Set the signature height
    const spaceAboveSignatureLine = 5; // Set space above the signature line
    doc.moveTo(margin, yPos + 25)
        .lineTo(margin + signatureWidth, yPos + 25)
        .stroke()
        .text('Firma de Solicitante', margin, yPos + 30, { width: signatureWidth, align: 'center' });

    // Calculate the position to place the signature so it's above the line
    const signatureYPosition = yPos - signatureHeight - spaceAboveSignatureLine;
    // Signature of the Authorizer, aligned to the right
    const authorizerSignatureX = pageWidth + margin - signatureWidth;
    doc.moveTo(authorizerSignatureX,  yPos + 25)
        .lineTo(pageWidth + margin, yPos + 25)
        .stroke()
        .text('Firma de Autorización', authorizerSignatureX, yPos + 30, { width: signatureWidth, align: 'center' });

    // Name and Title for Finance Authorization, centered below signatures
    yPos += lineHeight * 2; // Move down for finance authorization
    const financeSignatureX = margin + (pageWidth / 2 - signatureWidth / 2);
    doc.moveTo(financeSignatureX,  yPos + 25)
        .lineTo(financeSignatureX + signatureWidth, yPos + 25)
        .stroke()
        .text('Christian Loera', financeSignatureX, yPos +8, { width: signatureWidth, align: 'center' })
        .text('Autorización de Finanzas', financeSignatureX, yPos + 30, { width: signatureWidth, align: 'center' });

    // Place the applicant's signature image if provided
    if (firma) {
        doc.image(Buffer.from(firma.split(',')[1], 'base64'), margin, signatureYPosition + 15, { width: signatureWidth, height: 50 });
    }
    doc.pipe(stream);
    // Aquí agregarías el contenido a tu PDF, como se hizo anteriormente
    doc.fontSize(25).text('', 100, 80);
    doc.end();

   // Esperar a que el PDF se haya generado completamente
   stream.on('finish', async () => {
    // Asegúrate de que el archivo ha sido completamente escrito en el sistema de archivos
    stream.close(async () => {
        // Leer el archivo PDF generado y convertirlo a base64
        fs.readFile(pdfPath, async (err, data) => {
            if (err) {
                console.error('Error al leer el archivo PDF:', err);
                return res.status(500).send('Error al procesar el archivo PDF para enviar a DocuSign.');
            }

            const documentBase64 = data.toString('base64');

            try {
                const accountInfo = await authenticate();
                // Prepara los argumentos para enviar a DocuSign, incluyendo el documento en base64
                const args = {
                    accountId: accountInfo.apiAccountId,
                    accessToken: accountInfo.accessToken,
                    basePath: accountInfo.basePath,
                    documentBase64, // PDF en base64
                    signerEmail: correo, // Correo del firmante
                    signerName: "Nombre del Firmante", // Nombre del firmante
                    ccEmail: "email@example.com", // Correo CC (opcional)
                    ccName: "Nombre CC", // Nombre CC (opcional)
                };

                const result = await sendEnvelope(args);
                console.log(`Sobre enviado a DocuSign. EnvelopeId: ${result.envelopeId}`);

                // Configuración del transporte de correo electrónico para notificar al remitente/firmante
                let transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST, // Ejemplo: "smtp.office365.com"
                    port: process.env.EMAIL_PORT, // Ejemplo: 587
                    secure: false, // Ejemplo: false, para el puerto 587
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                });

                // Envío del correo electrónico con el PDF adjunto
                transporter.sendMail({
                    from: '"Formulario con Firma" ',
                    to: correo, // Correo del receptor
                    subject: 'Documento listo para firma',
                    text: 'Por favor, revisa y firma el documento adjunto.',
                    attachments: [{
                        filename: 'Documento.pdf',
                        path: pdfPath,
                        contentType: 'application/pdf'
                    }]
                }).then(info => {
                    console.log(`Correo de notificación enviado: ${info.messageId}`);
                    res.send('Formulario enviado y notificación por correo electrónico realizada.');
                }).catch(error => {
                    console.error('Error al enviar correo de notificación:', error);
                    res.status(500).send('Error al enviar correo de notificación.');
                });

                // Opcional: Eliminar el archivo PDF después del envío
                fs.unlinkSync(pdfPath);

            } catch (error) {
                console.error('Error al enviar documento a DocuSign:', error);
                res.status(500).send('Error al enviar documento a DocuSign.');
            }
        });
    });
});

});

app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
