const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'icon-192.png': [192],
  'icon-512.png': [512],
  'favicon.ico': [16, 32, 48, 64]
};

async function generateIcons() {
  // Create public/icons directory if it doesn't exist
  const iconsDir = path.join(__dirname, '../public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Generate each icon
  for (const [filename, sizeList] of Object.entries(sizes)) {
    const outputPath = path.join(iconsDir, filename);
    
    if (filename === 'favicon.ico') {
      // Generate favicon.ico
      const pngBuffers = await Promise.all(
        sizeList.map(size =>
          sharp(Buffer.from(`
            <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" fill="#1976D2"/>
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="white"/>
            </svg>
          `))
          .png()
          .toBuffer()
        )
      );
      
      // Combine PNGs into ICO
      await sharp(pngBuffers[0])
        .toFile(outputPath);
    } else {
      // Generate PNG icons
      const size = sizeList[0];
      await sharp(Buffer.from(`
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" fill="#1976D2"/>
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="white"/>
        </svg>
      `))
      .png()
      .toFile(outputPath);
    }
    
    console.log(`Generated ${filename}`);
  }
}

generateIcons().catch(console.error); 