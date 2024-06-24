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
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
const serviceAccount = require('./formulario-if---ft-firebase-adminsdk-u9bim-fd525dbea7.json');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://admin:j4bAB3JN3LBTWJsJ@formulario.ebd59ch.mongodb.net/?retryWrites=true&w=majority&appName=Formulario&tls=true";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
let bd;

client.connect()
  .then(() => {
    console.log("Connected successfully to MongoDB");
    bd = client.db("Formulario");
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'formulario.html'));
});

app.post('/enviar-formulario', async (req, res) => {
    const { firma, correo, correoAplicant, Mount, applicant, area, productService, quantity, credit, expenseAmount, provider, budgetItem, paymentForm, description, date, folio } = req.body;

    const doc = new PDFDocument();
    const pdfBuffers = [];
    const margin = 50;
    const pageWidth = doc.page.width - 2 * margin;
    const lineHeight = 14;
    const imagePath = path.join(__dirname, "public", "img", "LOGO BCL H.png");

    doc.image(imagePath, margin, 40, { width: 150 });

    let yPos = 120;

    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('Formato de Requisición', margin, yPos - 30, { align: 'center' });

    doc.fontSize(10)
        .font('Helvetica')
        .text(`# Folio: ${folio}`, pageWidth + margin - 150, yPos - 30, { width: 140, align: 'right' })
        .text(`Fecha: ${date}`, pageWidth + margin - 150, yPos - 15, { width: 140, align: 'right' });

    yPos += 50;

    function addFormField(label, value, y, xOffset = 150) {
        const fieldHeight = 15;
        const fieldPadding = 2;
        const valueWidth = pageWidth - (margin + xOffset);

        doc.rect(margin + xOffset, y + fieldPadding, valueWidth, fieldHeight)
            .fillOpacity(0.5)
            .fillAndStroke('grey', 'grey');

        doc.fillOpacity(1);

        doc.font('Helvetica').fontSize(10).fillColor('black');
        doc.text(label, margin, y, { width: 240, align: 'left' });

        doc.text(value || '', margin + xOffset + fieldPadding, y + fieldPadding, { width: valueWidth - (2 * fieldPadding), align: 'left' });

        yPos += fieldHeight + (2 * fieldPadding);
    }

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

    yPos += lineHeight * 2;

    doc.fontSize(25).text('', 100, 80);

    doc.on('data', chunk => pdfBuffers.push(chunk));
    doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(pdfBuffers);

        try {
            const result = await bd.collection('pdfs').insertOne({
                createdAt: new Date(),
                pdfData: pdfBuffer
            });
            const pdfId = result.insertedId;

            const formData = { ...req.body, pdfId: pdfId.toString() };
            const uniqueToken = uuidv4();

            await db.collection('solicitudesPendientes').doc(uniqueToken).set(formData);

            let transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT, 10),
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const authorizationLink = `https://formulariov3.onrender.com/autorizar-formulario/${uniqueToken}`;
            const noAuthorizationLink = `https://formulariov3.onrender.com/no-autorizar-formulario/${uniqueToken}`;
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
                      <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <table cellspacing="0" cellpadding="0" align="left">
                            <tr>
                              <td align="center" width="200" height="40" bgcolor="#28a745" style="border-radius: 5px;">
                                <a href="${authorizationLink}" target="_blank" style="font-size: 16px; font-family: sans-serif; color: #ffffff; text-decoration: none; line-height:40px; display: inline-block;">
                                  Autorizar
                                </a>
                              </td>
                            </tr>
                          </table>
                    
                          <table cellspacing="0" cellpadding="0" align="right">
                            <tr>
                              <td align="center" width="200" height="40" bgcolor="#dc3545" style="border-radius: 5px;">
                                <a href="${noAuthorizationLink}" target="_blank" style="font-size: 16px; font-family: sans-serif; color: #ffffff; text-decoration: none; line-height:40px; display: inline-block;">
                                  No Autorizar
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                      <div class="footer">
                          <p>Este es un mensaje automático, por favor no responder directamente.</p>
                      </div>
                  </div>
              </body>
              </html>
              `;
            const cancelLink = `https://formulariov3.onrender.com/cancelar-formulario/${uniqueToken}`;
            const htmlEmailContentCancel = `
                  <!DOCTYPE html>
                  <html lang="es">
                  <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
                          .email-container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                          .button { padding: 10px 20px; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; background-color: #dc3545; }
                      </style>
                  </head>
                  <body>
                      <div class="email-container">
                          <p>Hola ${applicant},</p>
                          <p>Has enviado una solicitud con el siguiente detalle:</p>
                          <p><strong>Producto o Servicio:</strong> ${productService}</p>
                          <p><strong>Monto Total:</strong> ${Mount}</p>
                          <p><strong>Descripción:</strong> ${description}</p>
                          <p>Si necesitas cancelar esta solicitud, por favor haz clic en el siguiente botón:</p>
                          <a href="${cancelLink}" class="button">Cancelar Solicitud</a>
                      </div>
                  </body>
                  </html>
              `;

            try {
                // Enviar el primer correo
                await transporter.sendMail({
                    from: '"BCL Management" <' + process.env.EMAIL_FROM + '>',
                    to: correoAplicant,
                    subject: 'Detalles de tu solicitud de formulario',
                    html: htmlEmailContentCancel
                });

                // Enviar el segundo correo
                await transporter.sendMail({
                    from: '"BCL Management" <' + process.env.EMAIL_FROM + '>',
                    to: formData.correo,
                    subject: 'Autorización de Solped Requerida',
                    html: htmlEmailContent,
                    attachments: [
                        {
                            filename: 'Formulario-Autorizado.pdf',
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        },
                        {
                            filename: 'LOGO BCL H.png',
                            path: path.join(__dirname, "public", "img", "LOGO BCL H.png"),
                            cid: 'logoBCLH'
                        }
                    ]
                });

                res.send('Correos enviados con éxito.');

            } catch (error) {
                console.error('Error al enviar correos:', error);
                res.status(500).send('Error al enviar correos.');
            }

        } catch (error) {
            console.error('Error al guardar el PDF en MongoDB:', error);
            res.status(500).send('Error al guardar el PDF en MongoDB.');
        }
    });

    doc.end();
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
    const pdfId = formData.pdfId;
    const pdfDocument = await bd.collection('pdfs').findOne({ _id: new ObjectId(pdfId) });

    if (!pdfDocument) {
        console.error('PDF no encontrado en MongoDB');
        return res.status(404).send('PDF no encontrado.');
    }

    const mountValue = parseFloat(formData.Mount);
    if (isNaN(mountValue)) {
        console.error('Mount no es un número válido');
        return res.status(400).send('Mount proporcionado no es un número válido.');
    }

    const rubroDocument = await bd.collection('rubros').findOne({ Concepto: formData.budgetItem });
    // Configurar el transporte para el envío de correos
    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    if (rubroDocument) {
        if (rubroDocument.Acumulado < mountValue) {
            console.error('El monto solicitado excede el Acumulado. el monto solicitado fue de ' + mountValue + ', y el saldo disponible es de ' + rubroDocument.Acumulado);
            await sendEmail(
                transporter,
                formData.correoAplicant,
                'Autorización denegada',
                'El monto solicitado excede el acumulado disponible. No se puede proceder con la autorización.'
            );
            return res.status(400).send('El monto solicitado de ' + mountValue + ' excede el acumulado disponible de ' + rubroDocument.Acumulado);
        }
        const newAcumulado = rubroDocument.Acumulado - mountValue;
        const updateResult = await bd.collection('rubros').updateOne(
            { Concepto: formData.budgetItem },
            { $set: { Acumulado: newAcumulado } }
        );

        console.log('Acumulado actualizado correctamente en rubro.');
    } else {
        console.log('Rubro con el concepto proporcionado no encontrado.');
        return res.status(404).send('Rubro con el concepto proporcionado no encontrado.');
    }

    // Autorizar el formulario y eliminar de solicitudes pendientes
    await db.collection('formulariosAutorizados').doc(token).set(formData);
    await docRef.delete();

    // Enviar correo de confirmación
    await sendEmail(
        transporter,
        `${formData.correoAplicant}, cobranza@biancorelab.com`,
        'Tu formulario ha sido autorizado',
        'Nos complace informarte que tu formulario ha sido autorizado.',
        pdfDocument.pdfData.buffer
    );

    res.send(`
        <html>
            <body>
                <p>La acción ha sido procesada. Esta ventana se cerrará automáticamente.</p>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.close();
                        }, 4500);
                    };
                </script>
            </body>
        </html>
    `);
});

async function sendEmail(transporter, recipient, subject, message, attachment = null) {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: recipient,
        subject: subject,
        text: message
    };

    if (attachment) {
        mailOptions.attachments = [{
            filename: 'Formulario-Autorizado.pdf',
            content: attachment,
            contentType: 'application/pdf'
        }];
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: ', info);
    } catch (error) {
        console.error('Error al enviar correo:', error);
    }
}

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

app.post('/api/transferencia', async (req, res) => {
    const session = await client.startSession();
    try {
        session.startTransaction();
        const { origen, destino, applicant } = req.body;
        const cantidad = parseFloat(req.body.cantidad);

        if (isNaN(cantidad) || cantidad <= 0) {
            throw new Error('La cantidad debe ser un número positivo');
        }

        const origenDoc = await client.db("Formulario").collection('rubros').findOne({ _id: new ObjectId(origen) });
        const destinoDoc = await client.db("Formulario").collection('rubros').findOne({ _id: new ObjectId(destino) });

        if (!origenDoc || typeof origenDoc.Acumulado !== 'number' || origenDoc.Acumulado < cantidad) {
            throw new Error('Fondos insuficientes o rubro origen no válido');
        }
        if (!destinoDoc || typeof destinoDoc.Acumulado !== 'number') {
            throw new Error('Rubro destino no válido');
        }

        // Definir variables de autorización según el solicitante
        let autorizadorEmail;
        let autorizadorNombre;
        let autorizado = false; // Por defecto, la solicitud no está autorizada
        let notificarPaco = false; // Por defecto, no se notifica a Paco
        let notificarEdelgado = false; // Por defecto, no se notifica a Edelgado

        if (applicant === 'cloera@biancorelab.com') {
            autorizadorEmail = 'luis@biancorelab.com';
            autorizadorNombre = 'Luis';
        } else if (applicant === 'paco@biancorelab.com') {
            autorizadorEmail = 'carlos@biancorelab.com';
            autorizadorNombre = 'Charly';
        } else if (applicant === 'luis@biancorelab.com' || applicant === 'carlos@biancorelab.com') {
            autorizado = true; // Si el solicitante es Luis o Carlos, la solicitud se autoriza al instante
            notificarPaco = true; // Se notifica a Paco
            notificarEdelgado = true; // Se notifica a Edelgado
        }

        // Generar un token único para la solicitud de transferencia
        const token = uuidv4();

        // Si la solicitud fue autorizada al instante, se notifica a Paco y a Edelgado
        if (autorizado) {
            // Agregar el nombre del autorizador al documento de la solicitud de transferencia
            const autorizador = autorizadorNombre;
        
            // Guardar la solicitud en la base de datos con el token, la autorización y el nombre del autorizador
            await client.db("Formulario").collection('solicitudesTransferencia').insertOne({
                token,
                origen,
                destino,
                cantidad,
                applicant,
                autorizado,
                autorizador // Guardamos el nombre del autorizador
            });
        
            // Enviar correos electrónicos a Chris y Paco
            const chrisEmail = 'chris@biancorelab.com'; // Dirección de correo de Chris
            const pacoEmail = 'paco@biancorelab.com'; // Dirección de correo de Paco
        
            const htmlEmailContentChris = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Solicitud de Transferencia Autorizada</title>
                    <style>
                        /* Estilos CSS para el correo electrónico */
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Solicitud de Transferencia Autorizada</h1>
                        <p>Estimado Chris,</p>
                        <p>Se ha autorizado una solicitud de transferencia realizada por ${autorizadorNombre}.</p>
                        <p>Por favor, revise los detalles en su sistema.</p>
                    </div>
                </body>
                </html>
            `;
        
            const htmlEmailContentPaco = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Solicitud de Transferencia Autorizada</title>
                    <style>
                        /* Estilos CSS para el correo electrónico */
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Solicitud de Transferencia Autorizada</h1>
                        <p>Estimado Paco,</p>
                        <p>Se ha autorizado una solicitud de transferencia realizada por ${autorizadorNombre}.</p>
                        <p>Por favor, revise los detalles en su sistema.</p>
                    </div>
                </body>
                </html>
            `;
        
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT, 10),
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        
            const mailOptionsChris = {
                from: 'edelgado@biancorelab.com',
                to: chrisEmail,
                subject: 'Solicitud de Transferencia Autorizada',
                html: htmlEmailContentChris
            };
        
            const mailOptionsPaco = {
                from: 'edelgado@biancorelab.com',
                to: pacoEmail,
                subject: 'Solicitud de Transferencia Autorizada',
                html: htmlEmailContentPaco
            };
        
            await transporter.sendMail(mailOptionsChris);
            await transporter.sendMail(mailOptionsPaco);
        
            res.json({ message: 'Solicitud de transferencia autorizada al instante.' });
            return;
        }
        // Obtener los nombres de los rubros
        const origenNombre = origenDoc.Concepto;
        const destinoNombre = destinoDoc.Concepto;

        // Enviar correo electrónico con botones para autorizar o cancelar
        const autorizarLink = `https://formulariov3.onrender.com/autorizar-transferencia/${token}`;
        const cancelarLink = `https://formulariov3.onrender.com/cancelar-transferencia/${token}`;

        const htmlEmailContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Solicitud de Autorización de Transferencia</title>
                <style>
                    /* Estilos CSS para el correo electrónico */
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Solicitud de Autorización de Transferencia</h1>
                    <p>Se ha solicitado una transferencia de fondos desde el rubro <strong>${origenNombre}</strong> al rubro <strong>${destinoNombre}</strong> por un monto de <strong>${cantidad}</strong>.</p>
                    <p>Por favor, ${autorizadorNombre}, autoriza o cancela esta solicitud.</p>
                    <div class="button-container">
                        <a href="${autorizarLink}" class="button button-autorizar">Autorizar</a>
                        <a href="${cancelarLink}" class="button button-cancelar">Cancelar</a>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Enviar el correo electrónico al autorizador correspondiente
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: 'edelgado@biancorelab.com',
            to: autorizadorEmail,
            subject: 'Solicitud de Autorización de Transferencia',
            html: htmlEmailContent
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Solicitud de transferencia enviada. Por favor, revise su correo electrónico.' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error durante la transacción:', error);
        res.status(500).json({ message: 'Error durante la transferencia', error: error.message });
    } finally {
        session.endSession();
    }
});

  app.get('/autorizar-transferencia/:token', async (req, res) => {
    const { token } = req.params;

    // Buscar la solicitud de transferencia en la base de datos
    const solicitud = await client.db("Formulario").collection('solicitudesTransferencia').findOne({ token });

    if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (solicitud.autorizado) {
        return res.status(400).json({ error: 'La solicitud ya ha sido autorizada' });
    }

    // Realizar la transferencia
    const session = await client.startSession();
    try {
        session.startTransaction();

        // Actualizar los saldos de los rubros
        const updateOrigen = await client.db("Formulario").collection('rubros').findOneAndUpdate(
            { _id: new ObjectId(solicitud.origen) },
            { $inc: { Acumulado: -solicitud.cantidad } },
            { session }
        );
        const updateDestino = await client.db("Formulario").collection('rubros').findOneAndUpdate(
            { _id: new ObjectId(solicitud.destino) },
            { $inc: { Acumulado: solicitud.cantidad } },
            { session }
        );

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Enviar correo electrónico al solicitante notificando la autorización
        await sendEmail(
            transporter,
            solicitud.applicant,
            'Autorización de Transferencia',
            `Su solicitud de transferencia ha sido autorizada.`
        );

        await session.commitTransaction(); // Confirmar la transacción después de enviar el correo electrónico

        // Actualizar el estado de la solicitud para marcarla como autorizada
        await client.db("Formulario").collection('solicitudesTransferencia').updateOne({ token }, { $set: { autorizado: true } });

        res.json({ message: 'Transferencia completada con éxito' });
    } catch (error) {
        await session.abortTransaction();
        console.error('Error durante la transacción:', error);
        res.status(500).json({ message: 'Error durante la transferencia', error: error.message });
    } finally {
        session.endSession();
    }
});

app.get('/cancelar-transferencia/:token', async (req, res) => {
    const { token } = req.params;

    // Buscar la solicitud de transferencia en la base de datos
    const solicitud = await client.db("Formulario").collection('solicitudesTransferencia').findOne({ token });

    if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (solicitud.autorizado) {
        return res.status(400).json({ error: 'La solicitud ya ha sido autorizada' });
    }

    // Eliminar la solicitud de la base de datos
    await client.db("Formulario").collection('solicitudesTransferencia').deleteOne({ token });

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Enviar correo electrónico al solicitante notificando la cancelación
    await sendEmail(
        transporter,
        solicitud.applicant,
        'Cancelación de Transferencia',
        `Su solicitud de transferencia ha sido cancelada.`
    );

    res.json({ message: 'Solicitud de transferencia cancelada' });
});
;

app.get('/cancelar-formulario/:token', async (req, res) => {
    const { token } = req.params;

    // Verificar si la solicitud está en la colección de autorizados
    let docRef = db.collection('formulariosAutorizados').doc(token);
    let doc = await docRef.get();
    let authorized = true;

    if (!doc.exists) {
        // Si no está en autorizados, buscar en pendientes
        docRef = db.collection('solicitudesPendientes').doc(token);
        doc = await docRef.get();
        authorized = false;

        if (!doc.exists) {
            return res.status(404).send('La solicitud no existe o ya fue procesada.');
        }
    }

    const formData = doc.data();

    if (authorized) {
        // Si la solicitud fue autorizada y ahora se desea cancelar
        // Enviar correo al autorizador para confirmar la cancelación
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const confirmCancelLink = `https://formulariov3.onrender.com/confirmar-cancelacion/${token}`;
        const rejectCancelLink = `https://formulariov3.onrender.com/rechazar-cancelacion/${token}`;

        const htmlEmailContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
                    .email-container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
                    .button { padding: 10px 20px; color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; background-color: #28a745; }
                    .button-danger { background-color: #dc3545; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <p>Hola,</p>
                    <p>Se ha solicitado la cancelación del formulario con folio ${formData.folio}. Por favor, confirme o rechace esta solicitud.</p>
                    <a href="${confirmCancelLink}" class="button">Confirmar Cancelación</a>
                    <a href="${rejectCancelLink}" class="button button-danger">Rechazar Cancelación</a>
                </div>
            </body>
            </html>
        `;

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: formData.correo, // Correo del autorizador
            subject: 'Confirmación de Cancelación de Formulario',
            html: htmlEmailContent
        });

        res.send('Correo de confirmación de cancelación enviado al autorizador.');
    } else {
        // Si la solicitud está pendiente simplemente eliminar
        await docRef.delete();
        res.send('La solicitud no autorizada ha sido cancelada exitosamente.');
    }
});

app.get('/confirmar-cancelacion/:token', async (req, res) => {
    const { token } = req.params;
    const docRef = db.collection('formulariosAutorizados').doc(token);
    const doc = await docRef.get();

    if (!doc.exists) {
        return res.status(404).send('La solicitud no existe o ya fue procesada.');
    }

    const formData = doc.data();
    // Revertir la autorización aquí (e.g., restaurar saldos o inventarios)

    await docRef.delete(); // Eliminar o mover el documento a una colección de cancelados

        // Envía un correo al autorizador y al solicitante notificando la cancelación
        await sendEmail(
            transporter,
            `${formData.correoAplicant}, cobranza@biancorelab.com`,
            'Reversión de Autorización',
            `La autorización del formulario con folio ${formData.folio} ha sido revertida y los fondos han sido restaurados.`
        );

    res.send('La cancelación ha sido confirmada y procesada correctamente.');
});

app.get('/rechazar-cancelacion/:token', async (req, res) => {
    const { token } = req.params;
    res.send('La cancelación ha sido rechazada.');
});

app.get('/api/rubros', async (req, res) => {
    try {
        const rubros = await bd.collection('rubros').find({}).toArray();
        res.json(rubros);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los rubros' });
    }
});

app.get('/api/saldos', async (req, res) => {
    try {
        const origen = await bd.collection('rubros').findOne({ _id: new ObjectId(req.query.origen) });
        const destino = await bd.collection('rubros').findOne({ _id: new ObjectId(req.query.destino) });

        
        if (!origen || !destino) {
            // Si alguno de los documentos no se encuentra, devuelve un 404.
            return res.status(404).json({ message: 'Rubro no encontrado' });
        }
        
        // Si todo está bien, devuelve los saldos.
        res.json({
            origen: { Acumulado: origen.Acumulado },
            destino: { Acumulado: destino.Acumulado }
        });
    } catch (error) {
        // Si hay un error en la consulta, captúralo y devuelve un 500.
        console.error('Error al obtener los saldos', error);
        res.status(500).json({ message: 'Error al obtener los saldos', error: error.message });
    }
});

app.get('/api/report-data', async (req, res) => {
    try {
      const rubrosActual = await bd.collection('rubros').find({}).toArray();
      const rubrosBudgeted = await bd.collection('rubrosCompleto').find({}).toArray();
  
      let reportData = rubrosBudgeted.map(budgeted => {
        let actual = rubrosActual.find(a => a.Concepto === budgeted.Concepto);
        return {
          Concepto: budgeted.Concepto,
          Area: budgeted.Area || 'General',
          Presupuesto: budgeted.Acumulado,
          Real: actual ? actual.Acumulado : 0,
          Diferencia: actual ? actual.Acumulado - budgeted.Acumulado : -budgeted.Acumulado
        };
      });
  
      res.json(reportData);
    } catch (error) {
      console.error('Error al obtener los datos del reporte:', error);
      res.status(500).json({ message: 'Error al obtener los datos del reporte' });
    }
  });
  
app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
});
