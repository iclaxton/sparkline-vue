// PieChart.js
// Pie chart implementation

import { BaseChart } from './BaseChart.js';

/**
 * PieChart renderer for sparkline pie charts
 * Renders values as colored slices sorted by size (largest first)
 * @extends BaseChart
 */
export class PieChart extends BaseChart {
  /**
   * Get default options for pie chart
   * @returns {Object} Default options object
   */
  getDefaults() {
    return {
      ...super.getDefaults(),
      type: 'pie',
      offset: 0,
      sliceColors: ['#3366cc', '#dc3912', '#ff9900', '#109618', '#66aa00',
                    '#dd4477', '#0099c6', '#990099'],
      borderWidth: 0,
      borderColor: '#000',
      highlightLighten: 1
    };
  }

  /**
   * Draw the pie chart with sorted slices (largest to smallest)
   */
  draw() {
    if (this.values.length === 0) return;

    const ctx = this.ctx;
    
    // Clear the canvas before drawing
    ctx.clearRect(0, 0, this.width, this.height);
    
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      sliceColors, borderWidth, borderColor, offset 
    } = this.options;

    // Calculate total and filter out null values, then sort descending
    const validValuesWithIndices = this.values
      .map((v, i) => ({ value: v, index: i }))
      .filter(item => item.value !== null && item.value > 0)
      .sort((a, b) => b.value - a.value); // Sort descending (largest first)
    
    if (validValuesWithIndices.length === 0) return;

    const total = validValuesWithIndices.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return;

    // Calculate center and radius - adjust center for padding
    const centerX = this.width / 2;
    const centerY = topOffset + height / 2;
    const radius = Math.min(this.width, height) / 2 - borderWidth;

    // Starting angle (with offset)
    let currentAngle = (-Math.PI / 2) + (offset * Math.PI / 180); // Start at top, apply offset

    // Draw slices (sorted by size, largest first)
    validValuesWithIndices.forEach((item, sortedIndex) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const color = sliceColors[sortedIndex % sliceColors.length];

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

  /**
   * Get the color for a specific pie slice region
   * @param {number} region - Region index
   * @returns {string|null} Color hex code or null
   */
  getRegionColor(region) {
    if (typeof region === 'number') {
      const { sliceColors } = this.options;
      return sliceColors[region % sliceColors.length];
    }
    return null;
  }

  /**
   * Get the pie slice region at a specific point for interaction detection
   * Calculates angular position to determine which slice is under the cursor
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Region index (original data index) or null
   */
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
    
    // Get sorted valid values with their original indices
    const validValuesWithIndices = this.values
      .map((v, i) => ({ value: v, index: i }))
      .filter(item => item.value !== null && item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    if (validValuesWithIndices.length === 0) return null;
    
    const total = validValuesWithIndices.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return null;
    
    let currentAngle = 0;
    for (let i = 0; i < validValuesWithIndices.length; i++) {
      const sliceAngle = (validValuesWithIndices[i].value / total) * 2 * Math.PI;
      
      if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
        // Return the original index from the data array
        return validValuesWithIndices[i].index;
      }
      
      currentAngle += sliceAngle;
    }
    
    return null;
  }

  /**
   * Get the nearest region to the mouse cursor for smooth tooltip following
   * For pie charts, uses same logic as getRegionAtPoint (angular-based)
   * @param {number} x - Mouse x coordinate
   * @param {number} y - Mouse y coordinate
   * @returns {number|null} Nearest region index or null
   */
  getNearestRegion(x, y) {
    // For pie charts, we'll use the same logic as getRegionAtPoint
    // since pie chart interaction is based on angular position
    return this.getRegionAtPoint(x, y);
  }

  /**
   * Draw highlight overlay with glow effect for the hovered pie slice
   * @param {number} region - Region index to highlight
   */
  drawHighlight(region) {
    if (region === null || region === undefined) return;
    
    const ctx = this.ctx;
    const { width, height, topOffset, bottomOffset } = this.getDrawingDimensions();
    const { 
      sliceColors, borderWidth, borderColor, offset 
    } = this.options;

    // Get sorted valid values with their original indices
    const validValuesWithIndices = this.values
      .map((v, i) => ({ value: v, index: i }))
      .filter(item => item.value !== null && item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    if (validValuesWithIndices.length === 0 || region >= this.values.length) return;

    const total = validValuesWithIndices.reduce((sum, item) => sum + item.value, 0);
    if (total <= 0) return;

    // Calculate center and radius
    const centerX = this.width / 2;
    const centerY = topOffset + height / 2;
    const radius = Math.min(this.width, height) / 2 - borderWidth;
    
    // Find which sorted slice corresponds to this region (original index)
    let sortedIndex = -1;
    for (let i = 0; i < validValuesWithIndices.length; i++) {
      if (validValuesWithIndices[i].index === region) {
        sortedIndex = i;
        break;
      }
    }
    
    if (sortedIndex === -1) return;

    // Calculate the angle for this slice
    let currentAngle = (-Math.PI / 2) + (offset * Math.PI / 180);
    for (let i = 0; i < sortedIndex; i++) {
      const sliceAngle = (validValuesWithIndices[i].value / total) * 2 * Math.PI;
      currentAngle += sliceAngle;
    }
    
    const sliceAngle = (validValuesWithIndices[sortedIndex].value / total) * 2 * Math.PI;
    const sliceColor = sliceColors[sortedIndex % sliceColors.length];
    
    // Save current style
    ctx.save();
    
    // Apply lighten effect to the slice color
    const highlightColor = this.lightenColor(sliceColor, this.options.highlightLighten);
    
    // Draw subtle glow effect around the slice
    ctx.shadowColor = highlightColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = highlightColor;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow and draw the highlighted slice on top
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = highlightColor;
    ctx.fill();
    
    // Draw border if specified
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();
    }
    
    // Restore style
    ctx.restore();
  }

  /**
   * Get standardized fields for a pie slice region (sparkline.js compliance)
   * Includes percentage calculation and sorted color assignment
   * @param {number} region - Region index
   * @returns {Object} Region fields object with percent and color
   */
  getRegionFields(region) {
    if (typeof region === 'number') {
      const value = this.values[region];
      const total = this.values.reduce((sum, v) => sum + v, 0);
      const { sliceColors } = this.options;
      
      // Find the sorted position of this region for color assignment
      const validValuesWithIndices = this.values
        .map((v, i) => ({ value: v, index: i }))
        .filter(item => item.value !== null && item.value > 0)
        .sort((a, b) => b.value - a.value);
      
      let sortedIndex = -1;
      for (let i = 0; i < validValuesWithIndices.length; i++) {
        if (validValuesWithIndices[i].index === region) {
          sortedIndex = i;
          break;
        }
      }
      
      return {
        isNull: value === null || value <= 0,
        value: value,
        index: region,
        percent: total > 0 ? (value / total * 100) : 0,
        color: sortedIndex >= 0 ? sliceColors[sortedIndex % sliceColors.length] : sliceColors[0],
        offset: region
      };
    }
    
    return super.getRegionFields(region);
  }
}
