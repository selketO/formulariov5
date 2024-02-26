const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const port = 3001;
require('dotenv').config();
const admin = require('firebase-admin');
const cors = require('cors');
app.use(cors());
app.use(express.json()); // para parsing application/json
app.use(express.static('public'));
const serviceAccount = require('./formulario-if---ft-firebase-adminsdk-u9bim-fd525dbea7.json');
const { v4: uuidv4 } = require('uuid');
 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = admin.firestore();
app.get('/', (req, res) => {
    // Cuando vayan a la ruta raíz, les servirás el archivo HTML.
    res.sendFile(path.join(__dirname, 'public', 'formulario.html'));
});
// Función para generar un ID único para la solicitud de autorización
function generateUniqueId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
app.post('/enviar-formulario', async (req, res) => {
    const { firma, correo,correoAplicant, Mount, applicant, area, productService, quantity, credit, expenseAmount, provider, budgetItem, paymentForm, description, date, folio } = req.body;
 
    // Crear un documento PDF
    const doc = new PDFDocument();
    const pdfPath = `firma-${Date.now()}.pdf`;
    const stream = fs.createWriteStream(pdfPath);
 
    // Define constants for layout
    const margin = 50;
    const pageWidth = doc.page.width - 2 * margin;
    const lineHeight = 14;
    const imagePath = path.join(__dirname, "public", "img", "LOGO BCL H.png");
 
    doc.image(imagePath, margin, 40, { width: 150 }); // Ajusta la posición y el tamaño según sea necesario
 
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
    addFormField('Monto Total:', Mount.toString(), yPos);
    addFormField('Forma de Pago:', paymentForm, yPos);
    addFormField('Días de crédito:', credit.toString(), yPos);
    addFormField('Rubro Presupuestal:', budgetItem, yPos);
 
    // Add extra space for the last field before signatures
    yPos += lineHeight * 2;
 
    doc.pipe(stream);
    // Aquí agregarías el contenido a tu PDF, como se hizo anteriormente
    doc.fontSize(25).text('', 100, 80);
    doc.end();
 
   // Esperar a que el PDF se haya generado completamente
   stream.on('finish', async () => {
 
 
    const formData = { ...req.body, pdfPath };
      const uniqueToken = uuidv4();
 
      // Guarda los datos del formulario con el token en Firestore
      await db.collection('solicitudesPendientes').doc(uniqueToken).set(formData);
 
      const authorizationLink = `https://formulariov2.onrender.com/autorizar-formulario/${uniqueToken}`;
      const noAuthorizationLink = `https://formulariov2.onrender.com/no-autorizar-formulario/${uniqueToken}`;
      const htmlEmailContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  color: #333;
                  line-height: 1.6;
              }
              .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  padding: 20px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
              }
              .header {
                  text-align: left;
                  border-bottom: 2px solid #005687;
                  padding-bottom: 10px;
                  margin-bottom: 20px;
              }
              .email-content {
                  text-align: left;
                  margin-top: 20px;
              }
              .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 10px;
                  font-size: 0.8em;
                  color: #888;
              }
              .button {
                  padding: 10px 20px;
                  margin: 10px 5px;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  text-decoration: none;
              }
              .authorize {
                  background-color: #28a745;
              }
              .decline {
                  background-color: #dc3545;
              }
              .button-container {
                  text-align: center;
              }
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
              <div class="button-container">
                  <a href="${authorizationLink}" class="button authorize">Autorizar</a>
                  <a href="${noAuthorizationLink}" class="button decline">No Autorizar</a>
              </div>
              <div class="footer">
                  <p>Este es un mensaje automático, por favor no responder directamente.</p>
              </div>
          </div>
      </body>
      </html>
      `;
     
 
      let transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT, 10),
          secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });
 
      transporter.sendMail({
          from: process.env.EMAIL_FROM, // Agrega tu dirección de correo "From"
          to: formData.correo, // Suponiendo que `correo` es el correo del autorizador
          subject: 'Autorización de Solped Requerida',
          html: htmlEmailContent,
          attachments: [
            {
                filename: 'Formulario-Autorizado.pdf', // Nombre descriptivo
                path: pdfPath, // Ruta al archivo PDF
                contentType: 'application/pdf'
            },
            {
                filename: 'LOGO BCL H.png',
                path: path.join(__dirname, "public", "img", "LOGO BCL H.png"),
                cid: 'logoBCLH' // Este CID se usa en el src del img tag en el HTML
            }
        ]
      }).then(info => {
          res.send('Formulario enviado y correo de autorización enviado.');
      }).catch(error => {
          console.error('Error al enviar correo de autorización:', error);
          res.status(500).send('Error al enviar correo de autorización.');
      });
  });
});
//--------------------------------------------------------------------------------------------------------Auutorizar-------------------------------------------------------------------------------------------
app.get('/autorizar-formulario/:token', async (req, res) => {
    const { token } = req.params;
    const docRef = db.collection('solicitudesPendientes').doc(token);
    const doc = await docRef.get();
 
    if (!doc.exists) {
        return res.status(404).send('La solicitud no existe o ya fue procesada.');
    }
 
    const formData = doc.data();
 
    // No es necesario convertir a ruta absoluta si ya guardaste una ruta absoluta
    const pdfPath = formData.pdfPath; // Asegúrate de que este campo exista
    console.log('PDF path:', pdfPath);
 
    if (!fs.existsSync(pdfPath)) {
        return res.status(500).send('El archivo PDF no existe.');
    }
    await db.collection('formulariosAutorizados').doc(token).set(formData);
    await docRef.delete();
 
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    console.log('Correo destinatario:', formData.correoAplicant);
 
    transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: `${formData.correoAplicant}, cobranza@biancorelab.com`, // Define el destinatario directamente para pruebas
        subject: 'Tu formulario ha sido autorizado',
        text: 'Nos complace informarte que tu formulario ha sido autorizado.',
        attachments: [
            {
                filename: 'Formulario-Autorizado.pdf', // Nombre descriptivo
                path: pdfPath, // Ruta al archivo PDF
                contentType: 'application/pdf'
            }
        ]
    }).then(info => {
        console.log('Correo de confirmación enviado: ', info);
        res.send(`
    <html>
        <body>
            <p>La acción ha sido procesada. Esta ventana se cerrará automáticamente.</p>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.close();
                    }, 1500); // Espera 3 segundos antes de intentar cerrar
                };
            </script>
        </body>
    </html>
`);
    }).catch(error => {
        console.error('Error al enviar correo de confirmación:', error);
        res.status(500).send('Error al enviar correo de confirmación.');
    });
});
// --------------------------------------------------------------------------------------------------------No autorizar-------------------------------------------------------------------------------------------
app.get('/no-autorizar-formulario/:token', async (req, res) => {
    const { token } = req.params;
    const docRef = db.collection('solicitudesPendientes').doc(token);
    const doc = await docRef.get();
 
    if (!doc.exists) {
        return res.status(404).send('La solicitud no existe o ya fue procesada.');
    }
 
    const formData = doc.data();
    // Opcionalmente, puedes mover el documento a otra colección, por ejemplo, 'formulariosNoAutorizados'
    await db.collection('formulariosNoAutorizados').doc(token).set(formData);
    await docRef.delete();
 
    // Envía un correo de notificación de no autorización
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
 
    transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: `${formData.correoAplicant}, cobranza@biancorelab.com`,
        subject: 'Formulario No Autorizado',
        text: `El formulario solicitado por ${formData.applicant} ha sido no autorizado.`,
        // Aquí decides si enviar o no el PDF como en el correo de autorización
    }).then(info => {
        console.log('Correo de no autorización enviado:', info);
        res.send(`
        <html>
            <body>
                <p>La acción ha sido procesada. Esta ventana se cerrará automáticamente.</p>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.close();
                        }, 1500); // Espera 3 segundos antes de intentar cerrar
                    };
                </script>
            </body>
        </html>
    `);
    }).catch(error => {
        console.error('Error al enviar correo de no autorización:', error);
        res.status(500).send('Error al enviar correo de no autorización.');
    });
});
 
 
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});