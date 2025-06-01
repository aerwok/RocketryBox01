import PDFDocument from 'pdfkit';
import fs from 'fs';

async function testPDFKit() {
  console.log('🧪 Testing PDFKit installation and basic functionality...');
  
  try {
    // Test 1: Check if PDFKit can be imported
    console.log('✅ PDFKit imported successfully');
    
    // Test 2: Create a simple PDF
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
    
    // Add some content
    doc.fontSize(20).text('Test PDF Generation', 40, 40);
    doc.fontSize(12).text('This is a test to verify PDFKit is working correctly.', 40, 80);
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 40, 100);
    
    // Finalize
    doc.end();
    
    // Wait for completion
    const pdfBuffer = await pdfPromise;
    
    console.log('✅ PDF generated successfully');
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
    
    // Test 3: Base64 conversion
    const base64 = pdfBuffer.toString('base64');
    const restored = Buffer.from(base64, 'base64');
    const isValid = Buffer.compare(pdfBuffer, restored) === 0;
    
    console.log('✅ Base64 conversion test:', isValid ? 'PASSED' : 'FAILED');
    
    // Save test file
    fs.writeFileSync('test-pdfkit-output.pdf', pdfBuffer);
    console.log('✅ Test PDF saved as: test-pdfkit-output.pdf');
    
    return true;
    
  } catch (error) {
    console.error('❌ PDFKit test failed:', error);
    return false;
  }
}

testPDFKit().then(success => {
  if (success) {
    console.log('\n🎉 PDFKit is working correctly!');
    console.log('The issue might be in the order controller or database connection.');
  } else {
    console.log('\n💥 PDFKit has issues that need to be resolved.');
  }
}); 