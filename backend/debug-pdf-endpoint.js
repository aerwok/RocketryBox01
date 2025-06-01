import express from 'express';
import PDFDocument from 'pdfkit';

const app = express();
const PORT = 3001;

app.get('/debug/pdf-test', async (req, res) => {
  console.log('Debug PDF endpoint called');
  
  try {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
    });
    
    // Simple PDF content
    doc.rect(0, 0, doc.page.width, 80).fill('#667eea');
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold');
    doc.text('DEBUG SHIPPING LABEL', 40, 25);
    
    doc.fillColor('black').fontSize(12);
    doc.text('AWB: DEBUG123456789', 40, 120);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 140);
    
    doc.end();
    
    const pdfBuffer = await pdfPromise;
    console.log('PDF generated, size:', pdfBuffer.length);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=debug-label.pdf');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Debug server on http://localhost:${PORT}/debug/pdf-test`);
}); 