// PieChart.js
// Pie chart implementation

import { BaseChart } from './BaseChart.js';

export class PieChart extends BaseChart {
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'pie',
      offset: 0,
      sliceColors: ['#3366cc', '#dc3912', '#ff9900', '#109618', '#66aa00',
                    '#dd4477', '#0099c6', '#990099'],
      borderWidth: 0,
      borderColor: '#000'
    };
  }

  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      sliceColors, borderWidth, borderColor, offset 
    } = this.options;

    // Calculate total and filter out null values
    const validValues = this.values.filter(v => v !== null && v > 0);
    if (validValues.length === 0) return;

    const total = validValues.reduce((sum, val) => sum + val, 0);
    if (total <= 0) return;

    // Calculate center and radius - adjust center for padding
    const centerX = this.width / 2;
    const centerY = topOffset + height / 2;
    const radius = Math.min(this.width, height) / 2 - borderWidth;

    // Starting angle (with offset)
    let currentAngle = (-Math.PI / 2) + (offset * Math.PI / 180); // Start at top, apply offset

    // Draw slices
    validValues.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const color = sliceColors[index % sliceColors.length];

      // Draw slice
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border if specified
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.stroke();
      }

      currentAngle += sliceAngle;
    });
  }

  // Get color for a specific region
  getRegionColor(region) {
    if (typeof region === 'number') {
      const { sliceColors } = this.options;
      return sliceColors[region % sliceColors.length];
    }
    return null;
  }

  getRegionAtPoint(x, y) {
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { borderWidth } = this.options;
    
    // Calculate center and radius - adjust for padding
    const centerX = this.width / 2;
    const centerY = topOffset + height / 2;
    const radius = Math.min(this.width, height) / 2 - borderWidth;
    
    // Check if point is within the pie circle
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > radius) {
      return null;
    }
    
    // Calculate angle of the point
    let angle = Math.atan2(dy, dx);
    // Convert to same angle system as pie chart (starting from top)
    angle = angle + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    
    // Apply offset
    const offset = (this.options.offset * Math.PI / 180);
    angle = (angle - offset + 2 * Math.PI) % (2 * Math.PI);
    
    // Filter valid values and calculate which slice the point is in
    const validValues = this.values.filter(v => v !== null && v > 0);
    if (validValues.length === 0) return null;
    
    const total = validValues.reduce((sum, val) => sum + val, 0);
    if (total <= 0) return null;
    
    let currentAngle = 0;
    for (let i = 0; i < validValues.length; i++) {
      const sliceAngle = (validValues[i] / total) * 2 * Math.PI;
      
      if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
        // Find the original index of this valid value
        let originalIndex = 0;
        let validIndex = 0;
        for (let j = 0; j < this.values.length; j++) {
          if (this.values[j] !== null && this.values[j] > 0) {
            if (validIndex === i) {
              originalIndex = j;
              break;
            }
            validIndex++;
          }
        }
        return originalIndex;
      }
      
      currentAngle += sliceAngle;
    }
    
    return null;
  }

  // Get nearest region to mouse cursor for smooth tooltip following
  getNearestRegion(x, y) {
    // For pie charts, we'll use the same logic as getRegionAtPoint
    // since pie chart interaction is based on angular position
    return this.getRegionAtPoint(x, y);
  }

  // Draw highlight for hovered pie slice
  drawHighlight(region) {
    if (region === null || region === undefined) return;
    
    const ctx = this.ctx;
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      sliceColors, borderWidth, borderColor, offset 
    } = this.options;

    // Filter valid values
    const validValues = this.values.filter(v => v !== null && v > 0);
    if (validValues.length === 0 || region >= this.values.length) return;

    const total = validValues.reduce((sum, val) => sum + val, 0);
    if (total <= 0) return;

    // Calculate center and radius
    const centerX = this.width / 2;
    const centerY = topOffset + height / 2;
    const radius = Math.min(this.width, height) / 2 - borderWidth;
    
    // Find which valid slice this region corresponds to
    let validIndex = -1;
    let currentValidIndex = 0;
    for (let i = 0; i <= region; i++) {
      if (this.values[i] !== null && this.values[i] > 0) {
        if (i === region) {
          validIndex = currentValidIndex;
          break;
        }
        currentValidIndex++;
      }
    }
    
    if (validIndex === -1) return;

    // Calculate the angle for this slice
    let currentAngle = (-Math.PI / 2) + (offset * Math.PI / 180);
    for (let i = 0; i < validIndex; i++) {
      const sliceAngle = (validValues[i] / total) * 2 * Math.PI;
      currentAngle += sliceAngle;
    }
    
    const sliceAngle = (validValues[validIndex] / total) * 2 * Math.PI;
    const sliceColor = sliceColors[validIndex % sliceColors.length];
    
    // Save current style
    ctx.save();
    
    // Save current style
    ctx.save();
    
    // Draw subtle glow effect around the slice
    ctx.shadowColor = sliceColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = sliceColor;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow and draw the original slice on top
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = sliceColor;
    ctx.fill();
    
    // Restore style
    ctx.restore();
  }
  
  // Helper method to lighten a color
  lightenColor(color, percent) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Lighten each component
    const lightenAmount = percent / 100;
    const newR = Math.min(255, Math.round(r + (255 - r) * lightenAmount));
    const newG = Math.min(255, Math.round(g + (255 - g) * lightenAmount));
    const newB = Math.min(255, Math.round(b + (255 - b) * lightenAmount));
    
    // Convert back to hex
    return '#' + [newR, newG, newB].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // Override getRegionFields for pie chart compliance
  getRegionFields(region) {
    if (typeof region === 'number') {
      const value = this.values[region];
      const total = this.values.reduce((sum, v) => sum + v, 0);
      const { sliceColors } = this.options;
      const validIndex = this.values.slice(0, region + 1).filter(v => v > 0).length - 1;
      
      return {
        isNull: value === null || value <= 0,
        value: value,
        index: region,
        percent: total > 0 ? (value / total * 100) : 0,
        color: sliceColors[validIndex % sliceColors.length],
        offset: region
      };
    }
    
    return super.getRegionFields(region);
  }
}
