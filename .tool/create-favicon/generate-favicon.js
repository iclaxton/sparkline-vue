const fs = require('fs');

// Create a simple SVG favicon that represents a sparkline
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <!-- White background with subtle border -->
  <rect width="32" height="32" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" rx="2"/>
  
  <!-- Main sparkline -->
  <path d="M4 24 L7 16 L10 22 L13 12 L16 18 L19 8 L22 20 L25 14 L28 10" 
        stroke="#007acc" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        fill="none"/>
  
  <!-- Baseline -->
  <line x1="4" y1="26" x2="28" y2="26" stroke="#f0f0f0" stroke-width="0.5"/>
  
  <!-- Key points -->
  <circle cx="4" cy="24" r="0.8" fill="#007acc"/>
  <circle cx="19" cy="8" r="1" fill="#ff6b35"/>
  <circle cx="28" cy="10" r="0.8" fill="#007acc"/>
</svg>`;

// Write SVG file
fs.writeFileSync('docs/favicon.svg', svgContent);

console.log('SVG favicon created at docs/favicon.svg');

// Create a simple ICO equivalent (base64 encoded PNG)
const canvas = require('canvas');
const { createCanvas } = canvas;

function createFavicon(size) {
    const canv = createCanvas(size, size);
    const ctx = canv.getContext('2d');
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Sparkline data
    const data = [24, 16, 22, 12, 18, 8, 20, 14, 10];
    const padding = size * 0.125; // 12.5% padding
    const width = size - padding * 2;
    const height = size - padding * 2;
    
    const stepX = width / (data.length - 1);
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal;
    
    // Draw sparkline
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = size >= 24 ? 2 : 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    data.forEach((val, i) => {
        const x = padding + i * stepX;
        const y = padding + height - ((val - minVal) / range) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Add key points
    ctx.fillStyle = '#007acc';
    [0, 5, 8].forEach(i => {
        const x = padding + i * stepX;
        const y = padding + height - ((data[i] - minVal) / range) * height;
        const radius = size >= 24 ? 1 : 0.8;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Highlight peak
    const peakIndex = 5;
    const x = padding + peakIndex * stepX;
    const y = padding + height - ((data[peakIndex] - minVal) / range) * height;
    ctx.fillStyle = '#ff6b35';
    ctx.beginPath();
    ctx.arc(x, y, size >= 24 ? 1.2 : 1, 0, 2 * Math.PI);
    ctx.fill();
    
    return canv.toBuffer('image/png');
}

try {
    // Try to create PNG versions
    const favicon32 = createFavicon(32);
    const favicon16 = createFavicon(16);
    
    fs.writeFileSync('docs/favicon-32x32.png', favicon32);
    fs.writeFileSync('docs/favicon-16x16.png', favicon16);
    fs.writeFileSync('docs/favicon.png', favicon32); // Default
    
    console.log('PNG favicons created successfully');
} catch (error) {
    console.log('Canvas not available, using SVG only:', error.message);
}
