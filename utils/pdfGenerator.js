const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.createPDF = (formData) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const pdfBuffers = [];

        const margin = 50;
        const pageWidth = doc.page.width - 2 * margin;
        const lineHeight = 14;
        const imagePath = path.join(__dirname, "../public/img/LOGO BCL H.png");

        doc.image(imagePath, margin, 40, { width: 150 });
        let yPos = 120;

        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Formato de Requisición', margin, yPos, { align: 'center' });

        doc.fontSize(10)
           .font('Helvetica')
           .text(`# Folio: ${formData.folio}`, pageWidth + margin - 150, yPos, { width: 140, align: 'right' })
           .text(`Fecha: ${formData.date}`, pageWidth + margin - 150, yPos + 15, { width: 140, align: 'right' });

        yPos += 50;

        const addFormField = (label, value, y, xOffset = 150) => {
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
        };

        addFormField('Solicitante (Operador):', formData.applicant, yPos);
        addFormField('Área:', formData.area, yPos);
        addFormField('Producto o Servicio:', formData.productService, yPos);
        addFormField('Cantidad:', formData.quantity.toString(), yPos);
        addFormField('Proveedor:', formData.provider, yPos);
        addFormField('Descripción / Observaciones de Producto o Servicio:', formData.description, yPos, 250);
        addFormField('Monto de Gasto (Pesos / sin iva):', formData.expenseAmount.toString(), yPos, 175);
        addFormField('Monto Total:', formData.Mount.toString(), yPos);
        addFormField('Forma de Pago:', formData.paymentForm, yPos);
        addFormField('Días de crédito:', formData.credit.toString(), yPos);
        addFormField('Rubro Presupuestal:', formData.budgetItem, yPos);

        yPos += lineHeight * 2;

        doc.on('data', chunk => pdfBuffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(pdfBuffers)));
        doc.end();
    });
};
