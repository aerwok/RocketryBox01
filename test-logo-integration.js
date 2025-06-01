import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the logo processing function
const testLogoProcessing = async () => {
  try {
    console.log('Testing logo processing...');
    
    // Path to the logo file
    const projectRoot = path.join(__dirname, '..');
    const logoPath = path.join(projectRoot, 'frontend', 'public', 'icons', 'logo.svg');
    
    console.log('Looking for logo at:', logoPath);
    console.log('Logo file exists:', fs.existsSync(logoPath));
    
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found');
      return false;
    }
    
    // Read SVG file
    const svgBuffer = fs.readFileSync(logoPath);
    console.log('SVG file size:', svgBuffer.length, 'bytes');
    
    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(svgBuffer)
      .png()
      .resize(120, 40)
      .toBuffer();
    
    console.log('PNG buffer size:', pngBuffer.length, 'bytes');
    console.log('✅ Logo processing successful!');
    
    return true;
  } catch (error) {
    console.error('❌ Error processing logo:', error.message);
    return false;
  }
};

// Run the test
testLogoProcessing().then(success => {
  if (success) {
    console.log('🎉 Logo integration test passed!');
  } else {
    console.log('💥 Logo integration test failed!');
  }
  process.exit(success ? 0 : 1);
}); 