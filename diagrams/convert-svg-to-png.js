const fs = require('fs');
const path = require('path');

// Read SVG file
const svgPath = path.join(__dirname, 'use-case-uml-simple.svg');
const svgContent = fs.readFileSync(svgPath, 'utf-8');

// Create a simple PNG using canvas-based approach via Node
// Since we don't have puppeteer installed, we'll create a base64 encoded HTML
// that can be converted to image

try {
  // Try using a different approach - create HTML wrapper and log it
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; }
        svg { display: block; }
      </style>
    </head>
    <body>
      ${svgContent}
      <script>
        // On page load, wait a moment then trigger download
        setTimeout(() => {
          const svg = document.querySelector('svg');
          const svgData = new XMLSerializer().serializeToString(svg);
          
          // Create canvas and convert
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          canvas.width = 1000;
          canvas.height = 800;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 1000, 800);
          
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            const pngData = canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            link.href = pngData;
            link.download = 'use-case-simple.png';
            document.body.appendChild(link);
            link.click();
          };
          
          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }, 500);
      </script>
    </body>
    </html>
  `;
  
  const tempHtmlPath = path.join(__dirname, 'temp-convert.html');
  fs.writeFileSync(tempHtmlPath, htmlContent);
  console.log('Created temporary HTML file for conversion');
  
} catch (err) {
  console.error('Error:', err.message);
}
