/**
 * @file
 * Example 002: Remote signer, cc, envelope has three documents
 * @author DocuSign
 */

const fs = require('fs-extra');
const docusign = require('docusign-esign');

/**
 * This function does the work of creating the envelope
 */

//ds-snippet-start:eSign2Step3
const sendEnvelope = async (args) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  let envelopeDefinition = makeEnvelope(args); // Asegúrate de que args ahora contiene documentBase64

  // Intenta crear y enviar el sobre con el documento codificado en base64
  let results = await envelopesApi.createEnvelope(args.accountId, { envelopeDefinition: envelopeDefinition });
  console.log(`Envelope ha sido creado y enviado. ID del Envelope: ${results.envelopeId}`);
  return results;
};
//ds-snippet-end:eSign2Step3

/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope
 * @returns {Envelope} An envelope definition
 * @private
 */

function makeEnvelope(args) {
  if (!args.documentBase64) {
      throw new Error("El documento en formato base64 no ha sido proporcionado.");
  }

  // Crear el objeto Document para DocuSign
  let document = new docusign.Document.constructFromObject({
      documentBase64: args.documentBase64,
      name: 'Documento para Firma',
      fileExtension: 'pdf',
      documentId: '1'
  });

  // Configurar el firmante y los destinatarios CC usando args
  let signer = docusign.Signer.constructFromObject({
      email: args.signerEmail,
      name: args.signerName,
      recipientId: '1',
      routingOrder: '1',
      // Añadir tabs de firma aquí si es necesario
  });

  let cc = docusign.CarbonCopy.constructFromObject({
      email: args.ccEmail,
      name: args.ccName,
      recipientId: '2',
      routingOrder: '2'
  });

  // Agregar los destinatarios al objeto EnvelopeDefinition
  let envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = 'Por favor firma este documento';
  envelopeDefinition.documents = [document];
  envelopeDefinition.recipients = docusign.Recipients.constructFromObject({
      signers: [signer],
      carbonCopies: [cc]
  });
  envelopeDefinition.status = 'sent';

  return envelopeDefinition;
}


/**
 * Creates document 1
 * @function
 * @private
 * @param {Object} args parameters for the envelope
 * @returns {string} A document in HTML format
 */

function document1(args) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName

  return `
    <!DOCTYPE html>
    <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family:sans-serif;margin-left:2em;">
        <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
            color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
        <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
          margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
          color: darkblue;">Order Processing Division</h2>
        <h4>Ordered by ${args.signerName}</h4>
        <p style="margin-top:0em; margin-bottom:0em;">Email: ${args.signerEmail}</p>
        <p style="margin-top:0em; margin-bottom:0em;">Copy to: ${args.ccName}, ${args.ccEmail}</p>
        <p style="margin-top:3em;">
  Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
        </p>
        <!-- Note the anchor tag for the signature field is in white. -->
        <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
        </body>
    </html>
  `;
}
//ds-snippet-end:eSign2Step2

module.exports = { sendEnvelope, makeEnvelope, document1 };
