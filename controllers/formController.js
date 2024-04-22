const pdfGenerator = require('../utils/pdfGenerator');
const { sendEmail } = require('../config/email');
const { db, bd } = require('../config/db');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

exports.renderForm = (req, res) => {
    // Enviar el archivo HTML del formulario
    res.sendFile(path.join(__dirname, '../public', 'formulario.html'));
};

exports.sendForm = async (req, res) => {
    const formData = req.body;
    try {
        const pdfBuffer = await pdfGenerator.createPDF(formData);
        const pdfId = await savePDFToMongoDB(pdfBuffer);
        formData.pdfId = pdfId.toString();

        const uniqueToken = uuidv4();
        await saveFormToFirestore(formData, uniqueToken);
        
        await sendEmail(formData, pdfBuffer);
        res.send('Correo de autorización enviado con éxito.');
    } catch (error) {
        console.error('Error al procesar el formulario:', error);
        res.status(500).send('Error al procesar el formulario.');
    }
};

exports.authorizeForm = async (req, res) => {
    const token = req.params.token;
    try {
        const formData = await fetchFormData(token);
        await bd.collection('formulariosAutorizados').doc(token).set(formData);
        await db.collection('solicitudesPendientes').doc(token).delete();
        await sendAuthorizationEmail(formData, true);
        res.send('Formulario autorizado con éxito.');
    } catch (error) {
        console.error('Error al autorizar el formulario:', error);
        res.status(500).send('Error al autorizar el formulario.');
    }
};

exports.declineForm = async (req, res) => {
    const token = req.params.token;
    try {
        const formData = await fetchFormData(token);
        await bd.collection('formulariosNoAutorizados').doc(token).set(formData);
        await db.collection('solicitudesPendientes').doc(token).delete();
        await sendAuthorizationEmail(formData, false);
        res.send('Formulario no autorizado.');
    } catch (error) {
        console.error('Error al no autorizar el formulario:', error);
        res.status(500).send('Error al no autorizar el formulario.');
    }
};

// Helper functions
async function savePDFToMongoDB(pdfBuffer) {
    const result = await bd.collection('pdfs').insertOne({
        createdAt: new Date(),
        pdfData: pdfBuffer
    });
    return result.insertedId;
}

async function saveFormToFirestore(formData, uniqueToken) {
    await db.collection('solicitudesPendientes').doc(uniqueToken).set(formData);
}

async function fetchFormData(token) {
    const doc = await db.collection('solicitudesPendientes').doc(token).get();
    if (!doc.exists) {
        throw new Error('No such document!');
    }
    return doc.data();
}

async function sendAuthorizationEmail(formData, isAuthorized) {
    const subject = isAuthorized ? 'Tu formulario ha sido autorizado' : 'Formulario No Autorizado';
    const message = isAuthorized ?
        'Nos complace informarte que tu formulario ha sido autorizado.' :
        `El formulario solicitado por ${formData.applicant} ha sido no autorizado.`;
    await sendEmail({
        to: formData.correoAplicant,
        subject: subject,
        text: message,
        // Consider attaching PDF or not based on isAuthorized
    });
}
