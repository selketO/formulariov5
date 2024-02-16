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
  // Data for this method
  // args.basePath
  // args.accessToken
  // args.accountId

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    let results = null;

  // Make the envelope request body
  let envelope = makeEnvelope(args.envelopeArgs);

  // Call the Envelopes::create API method
  // Exceptions will be caught by the calling function
  results = await envelopesApi.createEnvelope(args.accountId, {
    envelopeDefinition: envelope,
  });
  let envelopeId = results.envelopeId;

  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
  return { envelopeId: envelopeId };
};
//ds-snippet-end:eSign2Step3

/**
 * Creates envelope
 * @function
 * @param {Object} args parameters for the envelope
 * @returns {Envelope} An envelope definition
 * @private
 */

//ds-snippet-start:eSign2Step2
function makeEnvelope(args) {
  // args debe incluir:
  // args.signerEmail, args.signerName, args.ccEmail, args.ccName
  // args.pdfPath: La ruta al archivo PDF que deseas enviar para firma

  // Leer el archivo PDF generado
  let pdfBytes = fs.readFileSync(args.pdfPath); // Asegúrate de que args.pdfPath sea la ruta correcta al PDF
  
  // Crear la definición del documento para el PDF
  let pdfDoc = new docusign.Document.constructFromObject({
    documentBase64: Buffer.from(pdfBytes).toString('base64'),
    name: 'Documento para firma', // Puedes personalizar este nombre
    fileExtension: 'pdf',
    documentId: '1' // Asegúrate de que el ID del documento sea único dentro del sobre
  });

  // Crear la definición del sobre
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = 'Por favor firma este documento';
  env.documents = [pdfDoc]; // Incluir solo el documento PDF

  // Configurar el firmante y los recipientes de copia carbónica (cc)
  let signer1 = docusign.Signer.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    recipientId: '1',
    routingOrder: '1',
  });

  let cc1 = docusign.CarbonCopy.constructFromObject({
    email: args.ccEmail,
    name: args.ccName,
    routingOrder: '2',
    recipientId: '2',
  });

  // Configurar las ubicaciones de firma en el documento, si es necesario
  // Esto puede requerir ajustes según dónde necesites que los firmantes firmen el documento
  let signHere = docusign.SignHere.constructFromObject({
    anchorString: '**signature_1**', // Ajusta o elimina según la necesidad de tu documento
    anchorYOffset: '10',
    anchorUnits: 'pixels',
    anchorXOffset: '20',
  });

  let signer1Tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere], // Asegúrate de ajustar según las necesidades de tu documento
  });
  signer1.tabs = signer1Tabs;

  // Agregar los recipientes al sobre
  env.recipients = docusign.Recipients.constructFromObject({
    signers: [signer1],
    carbonCopies: [cc1],
  });

  // Establecer el estado del sobre para enviarlo inmediatamente
  env.status = 'sent';

  return env;
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
