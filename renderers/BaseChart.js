// BaseChart.js
// Base class for all chart types

export class BaseChart {
  constructor(ctx, props) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.data = props.data;
    this.width = props.width;
    this.height = props.height;
    this.options = { ...this.getDefaults(), ...props.options };
    this.values = this.processValues(this.data);
    this.currentRegion = null;
    this.tooltip = null;
    this.regions = [];
    this.setupInteractions();
  }

  getDefaults() {
    return {
      lineColor: '#00f',
      fillColor: '#cdf',
      spotColor: '#f80',
      minSpotColor: '#f80',
      maxSpotColor: '#f80',
      spotRadius: 1.5,
      lineWidth: 1,
      highlightSpotColor: '#5f5',
      highlightLineColor: '#f22',
      normalRangeMin: undefined,
      normalRangeMax: undefined,
      normalRangeColor: '#ccc',
      drawNormalOnTop: false,
      chartRangeMin: undefined,
      chartRangeMax: undefined,
      defaultPixelsPerValue: 3,
      disableTooltips: false,
      disableHighlight: false,
      disableInteraction: false,
      tooltipPrefix: '',
      tooltipSuffix: '',
      tooltipFormat: '{{value}}',
      tooltipFormatter: null,
      highlightLighten: 1.4,
      topPadding: 3,  // Add top padding for all charts
      bottomPadding: 3  // Add bottom padding for all charts
    };
  }

  processValues(data) {
    if (!Array.isArray(data)) return [];
    
    return data.map(val => {
      if (val === null || val === undefined) return null;
      if (Array.isArray(val)) return val; // For x,y pairs
      return parseFloat(val);
    }).filter((val, index, arr) => {
      // Keep nulls but filter out NaN values
      return val === null || !isNaN(val) || Array.isArray(val);
    });
  }

  getMinMax(values = this.values) {
    const nums = values.filter(v => v !== null && !Array.isArray(v));
    if (nums.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...nums),
      max: Math.max(...nums)
    };
  }

  // Utility method for color manipulation
  lightenColor(color, factor) {
    if (!color || typeof color !== 'string') return color;
    
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.floor((num >> 16) * factor));
      const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) * factor));
      const b = Math.min(255, Math.floor((num & 0x0000FF) * factor));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    return color;
  }

  // Get effective drawing dimensions accounting for padding
  getDrawingDimensions() {
    return {
      width: this.width,
      height: Math.max(1, this.height - this.options.topPadding - this.options.bottomPadding),
      topOffset: this.options.topPadding,
      bottomOffset: this.options.bottomPadding
    };
  }

  // Abstract method to be implemented by subclasses
  draw() {
    throw new Error('draw() method must be implemented by subclass');
  }

  // Setup mouse interactions
  setupInteractions() {
    if (this.options.disableInteraction) return;

    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    this.boundHandleClick = this.handleClick.bind(this);

    // Mouse events
    this.canvas.addEventListener('mousemove', this.boundHandleMouseMove);
    this.canvas.addEventListener('mouseleave', this.boundHandleMouseLeave);
    this.canvas.addEventListener('click', this.boundHandleClick);
    this.canvas.style.cursor = 'pointer';

    // Touch events for mobile support
    this.setupTouchSupport();
  }

  // Setup touch support for mobile devices (only if touch is supported)
  setupTouchSupport() {
    if (this.options.disableInteraction || this.options.disableTooltips) return;
    
    // Only add touch support if the browser supports touch
    if (!('ontouchstart' in window) && !navigator.maxTouchPoints && !navigator.msMaxTouchPoints) {
      return;
    }

    let touchStartTime = 0;
    let touchStartPos = null;

    // Bind touch event handlers
    this.boundHandleTouchStart = (event) => {
      event.preventDefault();
      this.isTouch = true;
      touchStartTime = Date.now();
      
      const touch = event.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      
      // Create synthetic mouse event for the chart's mouse handlers
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.pageX || (touch.clientX + window.pageXOffset),
        pageY: touch.pageY || (touch.clientY + window.pageYOffset),
        target: this.canvas
      };
      
      // Use the chart's built-in mouse move handler
      this.handleMouseMove(syntheticEvent);
    };

    this.boundHandleTouchMove = (event) => {
      event.preventDefault();
      if (this.isTouch && event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        // Check if touch is still within canvas bounds
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          
          // Create synthetic mouse event
          const syntheticEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX || (touch.clientX + window.pageXOffset),
            pageY: touch.pageY || (touch.clientY + window.pageYOffset),
            target: this.canvas
          };
          
          // Use the chart's built-in mouse move handler
          this.handleMouseMove(syntheticEvent);
        } else {
          // Touch moved outside canvas - hide tooltip
          this.handleMouseLeave();
        }
      }
    };

    this.boundHandleTouchEnd = (event) => {
      event.preventDefault();
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // If it was a quick touch (tap) and didn't move much, treat it as a click
      if (touchDuration < 300 && touchStartPos && event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        const moveDistance = Math.sqrt(
          Math.pow(touch.clientX - touchStartPos.x, 2) + 
          Math.pow(touch.clientY - touchStartPos.y, 2)
        );
        
        // If the touch didn't move much (less than 10px), treat as a click
        if (moveDistance < 10) {
          const syntheticClickEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX || (touch.clientX + window.pageXOffset),
            pageY: touch.pageY || (touch.clientY + window.pageYOffset),
            target: this.canvas
          };
          
          // Trigger click handler
          this.handleClick(syntheticClickEvent);
        }
      }
      
      this.isTouch = false;
      touchStartPos = null;
      
      // Use the chart's built-in mouse leave handler to clean up tooltips
      this.handleMouseLeave();
    };

    // Add touch event listeners
    this.canvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.boundHandleTouchEnd, { passive: false });

    // Store touch state on the chart instance
    this.isTouch = false;
  }

  // Handle mouse move events
  handleMouseMove(event) {
    if (this.options.disableInteraction) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Always find nearest point instead of requiring mouse to be in region
    const region = this.getNearestRegion(x, y);
    
    if (region !== this.currentRegion) {
      const previousRegion = this.currentRegion;
      this.currentRegion = region;
      this.updateTooltip(event, region);
      this.redrawWithHighlight();
      
      // Dispatch region change event
      this.canvas.dispatchEvent(new CustomEvent('sparklineRegionChange', {
        detail: { 
          sparklines: [this],
          region: region,
          previousRegion: previousRegion
        }
      }));
    } else if (region !== null) {
      // Update tooltip position even if same region
      this.updateTooltipPosition(event);
    }
  }

  // Handle mouse leave events
  handleMouseLeave() {
    if (this.currentRegion !== null) {
      this.currentRegion = null;
      this.hideTooltip();
      this.redrawWithHighlight();
    }
  }

  // Handle click events
  handleClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const region = this.getRegionAtPoint(x, y);
    
    if (region !== null) {
      // Dispatch click event with jQuery Sparkline compatible format
      this.canvas.dispatchEvent(new CustomEvent('sparklineClick', {
        detail: { 
          sparklines: [this],
          region: region,
          value: this.getValueFromRegion(region)
        }
      }));
    }
  }

  // Get region at specific point - to be implemented by subclasses
  getRegionAtPoint(x, y) {
    return null;
  }

  // Get nearest region to mouse cursor - to be implemented by subclasses  
  getNearestRegion(x, y) {
    // Default fallback to original behavior
    return this.getRegionAtPoint(x, y);
  }

  // Get tooltip content - can be overridden for multi-value tooltips
  getTooltipContent(region) {
    // Default implementation returns null, but we can enhance single-value tooltips with colors
    // Subclasses can override this to return { items: [...] } for multi-value tooltips
    
    // For single-value tooltips, try to get color information
    const color = this.getRegionColor(region);
    
    if (color && typeof region === 'number' && region >= 0 && region < this.values.length) {
      const value = this.values[region];
      const formattedValue = this.formatTooltipValue(value, region);
      const fullLabel = `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;
      
      return {
        items: [{
          label: fullLabel,
          color: color
        }]
      };
    }
    
    return null; // Use default single-value tooltip without color
  }

  // Get the color for a specific region - can be overridden by subclasses
  getRegionColor(region) {
    // Default implementation - subclasses should override this
    return null;
  }

  // Update just tooltip position without changing content
  updateTooltipPosition(event) {
    if (this.tooltip && this.tooltip.style.display === 'block') {
      // Check if this is a touch event or if we're on a touch device
      const isTouch = this.isTouch || 
                     (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) ||
                     ('ontouchstart' in window);
      
      let left, top;
      
      if (isTouch) {
        // Get tooltip dimensions for better positioning
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width || 120; // fallback width
        const tooltipHeight = tooltipRect.height || 40; // fallback height
        
        // For touch devices: position tooltip to top-left with offset based on tooltip size
        // Use tooltip width + 20px buffer for left offset, tooltip height + 20px buffer for top offset
        left = event.pageX - (tooltipWidth + 20);
        top = event.pageY - (tooltipHeight + 20);
        
        // Prevent tooltip from going off the left edge
        if (left < 10) {
          left = event.pageX + 15;  // Fallback to right side
        }
        
        // Prevent tooltip from going above viewport
        if (top < 10) {
          top = event.pageY + 30;   // Fallback to below finger
        }
      } else {
        // For mouse: keep original positioning
        left = event.pageX + 10;
        top = event.pageY - 25;
      }
      
      this.tooltip.style.left = left + 'px';
      this.tooltip.style.top = top + 'px';
    }
  }

  // Update tooltip
  updateTooltip(event, region) {
    if (this.options.disableTooltips || region === null) {
      this.hideTooltip();
      return;
    }

    if (!this.tooltip) {
      this.createTooltip();
    }

    const tooltipContent = this.getTooltipContent(region);
    
    // Clear existing content
    this.tooltip.innerHTML = '';
    
    // Check if we have multi-value content with colors
    if (tooltipContent && typeof tooltipContent === 'object' && tooltipContent.items) {
      // Multi-value tooltip with color indicators
      const container = document.createElement('div');
      
      tooltipContent.items.forEach(item => {
        const line = document.createElement('div');
        line.style.cssText = 'display: flex; align-items: center; margin: 2px 0; gap: 6px;';
        
        if (item.color) {
          const colorSpot = document.createElement('div');
          colorSpot.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${item.color};
            flex-shrink: 0;
          `;
          line.appendChild(colorSpot);
        }
        
        const label = document.createElement('span');
        label.textContent = item.label;
        line.appendChild(label);
        
        container.appendChild(line);
      });
      
      this.tooltip.appendChild(container);
    } else {
      // Single value tooltip - try to add color if available
      const value = this.values[region];
      const formattedValue = this.formatTooltipValue(value, region);
      const fullLabel = `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;
      
      // Try to get color for this region
      const color = this.getRegionColor(region);
      
      if (color) {
        // Show single value with color spot
        const container = document.createElement('div');
        const line = document.createElement('div');
        line.style.cssText = 'display: flex; align-items: center; gap: 6px;';
        
        const colorSpot = document.createElement('div');
        colorSpot.style.cssText = `
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: ${color};
          flex-shrink: 0;
        `;
        line.appendChild(colorSpot);
        
        const label = document.createElement('span');
        label.textContent = fullLabel;
        line.appendChild(label);
        
        container.appendChild(line);
        this.tooltip.appendChild(container);
      } else {
        // Fallback to plain text tooltip
        this.tooltip.textContent = fullLabel;
      }
    }
    
    // Use the centralized positioning logic
    this.updateTooltipPosition(event);
    this.tooltip.style.display = 'block';
  }

  // Get or create shared tooltip element (prevents creating hundreds of DOM elements)
  static getSharedTooltip() {
    if (!BaseChart.sharedTooltip) {
      BaseChart.sharedTooltip = document.createElement('div');
      BaseChart.sharedTooltip.className = 'sparkline-tooltip';
      BaseChart.sharedTooltip.style.cssText = `
        position: absolute;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-family: Arial, sans-serif;
        pointer-events: none;
        z-index: 1000;
        display: none;
        line-height: 1.4;
        white-space: pre-line;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        max-width: 200px;
      `;
      document.body.appendChild(BaseChart.sharedTooltip);
    }
    return BaseChart.sharedTooltip;
  }

  // Create tooltip element (now uses shared tooltip)
  createTooltip() {
    this.tooltip = BaseChart.getSharedTooltip();
  }

  // Hide tooltip
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  // Format tooltip value
  formatTooltipValue(value, region) {
    if (value === null) return 'null';
    
    // Check if custom formatter function is provided
    if (this.options.tooltipFormatter && typeof this.options.tooltipFormatter === 'function') {
      try {
        const result = this.options.tooltipFormatter(value, region, this);
        // Security: Ensure only strings are returned, no HTML/scripts allowed
        return this.sanitizeTooltipContent(result);
      } catch (error) {
        console.warn('Custom tooltip formatter error:', error);
        return this.getDefaultTooltipFormat(value, region);
      }
    }
    
    // For box charts, always use the default format regardless of tooltipFormat option
    if (this.options.type === 'box') {
      return this.getDefaultTooltipFormat(value, region);
    }
    
    // Check if custom format string is provided
    if (this.options.tooltipFormat && typeof this.options.tooltipFormat === 'string') {
      return this.formatTooltipString(this.options.tooltipFormat, value, region);
    }
    
    // Default formatting based on chart type
    return this.getDefaultTooltipFormat(value, region);
  }

  // Format tooltip using template string
  formatTooltipString(format, value, region) {
    const data = this.getTooltipData(value, region);
    
    return format.replace(/\{\{(\w+)(?:\.(\d+))?\}\}/g, (match, key, precision) => {
      let val = data[key];
      if (val === undefined) return match;
      
      if (typeof val === 'number' && precision !== undefined) {
        val = val.toFixed(parseInt(precision));
      }
      
      return val;
    });
  }

  // Get data object for tooltip templating
  getTooltipData(value, region) {
    return {
      value: value,
      index: region,
      x: this.xvalues ? this.xvalues[region] : region,
      y: value
    };
  }

  // Default tooltip format - can be overridden by subclasses
  getDefaultTooltipFormat(value, region) {
    return typeof value === 'number' ? value.toFixed(2) : value.toString();
  }

  // Sanitize tooltip content to prevent XSS - only allow plain text strings
  sanitizeTooltipContent(content) {
    // Convert to string and strip any HTML/script content
    const str = String(content);
    
    // Remove any HTML tags, script content, and event handlers
    return str
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
      .replace(/&lt;script.*?&gt;.*?&lt;\/script&gt;/gi, '') // Remove encoded scripts
      .trim()
      .substring(0, 500); // Limit length to prevent excessive tooltips
  }

  // Redraw with highlight
  redrawWithHighlight() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.draw();
    if (this.currentRegion !== null && !this.options.disableHighlight) {
      this.drawHighlight(this.currentRegion);
    }
  }

  // Draw highlight - to be implemented by subclasses
  drawHighlight(region) {
    // Default implementation - can be overridden
  }

  // Get current region fields (jQuery Sparkline compatible)
  getCurrentRegionFields() {
    if (this.currentRegion === null) return null;
    
    return this.getRegionFields(this.currentRegion);
  }

  // Get region fields for a specific region (to be overridden by subclasses)
  getRegionFields(region) {
    if (typeof region === 'number') {
      // Standard numeric region
      return {
        isNull: this.values[region] === null,
        value: this.values[region],
        index: region,
        x: region,
        y: this.values[region]
      };
    }
    
    // For bullet charts and other complex regions, return the region object itself
    if (typeof region === 'object' && region !== null) {
      return {
        isNull: region.value === null,
        value: region.value,
        index: region.index,
        fieldkey: region.fieldkey,
        ...region
      };
    }
    
    return null;
  }

  // Helper method to get value from region
  getValueFromRegion(region) {
    if (typeof region === 'number') {
      return this.values[region];
    }
    if (typeof region === 'object' && region !== null) {
      return region.value;
    }
    return null;
  }

  // Cleanup method
  destroy() {
    // Add defensive null check for canvas
    if (!this.canvas) return;
    
    // Remove mouse event listeners to prevent memory leaks
    if (this.boundHandleMouseMove) {
      this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    }
    if (this.boundHandleMouseLeave) {
      this.canvas.removeEventListener('mouseleave', this.boundHandleMouseLeave);
    }
    if (this.boundHandleClick) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
    }
    
    // Remove touch event listeners (only if they were added)
    if (this.boundHandleTouchStart) {
      this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
    }
    if (this.boundHandleTouchMove) {
      this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
    }
    if (this.boundHandleTouchEnd) {
      this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
      this.canvas.removeEventListener('touchcancel', this.boundHandleTouchEnd);
    }
    
    // Reset canvas cursor
    this.canvas.style.cursor = 'default';
    
    // Reset touch state for consistency
    this.isTouch = false;
    
    // Hide tooltip but don't remove it since it's shared
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  // Reinitialize for object pooling (performance optimization)
  reinitialize(ctx, props) {
    // Update core properties
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.data = props.data;
    this.width = props.width;
    this.height = props.height;
    this.options = { ...this.getDefaults(), ...props.options };
    this.values = this.processValues(this.data);
    
    // Reset state
    this.currentRegion = null;
    this.regions = [];
    
    // Reinitialize interactions
    this.setupInteractions();
  }

  // Reset chart state for object pooling (lightweight cleanup)
  reset() {
    // Add defensive null check for canvas
    if (!this.canvas) return;
    
    // Remove mouse event listeners but keep the object
    if (this.boundHandleMouseMove) {
      this.canvas.removeEventListener('mousemove', this.boundHandleMouseMove);
    }
    if (this.boundHandleMouseLeave) {
      this.canvas.removeEventListener('mouseleave', this.boundHandleMouseLeave);
    }
    if (this.boundHandleClick) {
      this.canvas.removeEventListener('click', this.boundHandleClick);
    }
    
    // Remove touch event listeners (only if they were added)
    if (this.boundHandleTouchStart) {
      this.canvas.removeEventListener('touchstart', this.boundHandleTouchStart);
    }
    if (this.boundHandleTouchMove) {
      this.canvas.removeEventListener('touchmove', this.boundHandleTouchMove);
    }
    if (this.boundHandleTouchEnd) {
      this.canvas.removeEventListener('touchend', this.boundHandleTouchEnd);
      this.canvas.removeEventListener('touchcancel', this.boundHandleTouchEnd);
    }
    
    // Reset state but keep the object structure
    this.currentRegion = null;
    this.regions = [];
    this.isTouch = false;
    
    // Reset canvas cursor
    if (this.canvas) {
      this.canvas.style.cursor = 'default';
    }
    
    // Hide tooltip but don't remove it (for shared tooltip optimization)
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  // Static method to clean up shared tooltip (call this when disposing of all charts)
  static cleanupSharedTooltip() {
    if (BaseChart.sharedTooltip && BaseChart.sharedTooltip.parentNode) {
      BaseChart.sharedTooltip.parentNode.removeChild(BaseChart.sharedTooltip);
      BaseChart.sharedTooltip = null;
    }
  }
}

// Initialize shared tooltip property
BaseChart.sharedTooltip = null;
