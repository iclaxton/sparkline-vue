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
    this.lastMouseEvent = null; // Store last mouse event for tooltip refresh
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

    // Register for shared scroll handling (performance optimization)
    BaseChart.registerScrollHandler(this);

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

    // Store last mouse event for tooltip refresh capability
    this.lastMouseEvent = event;

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
    this.lastMouseEvent = null; // Clear stored mouse event
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



  // Get or create shared tooltip element (Vue-safe version)
  static getSharedTooltip() {
    if (!BaseChart.sharedTooltip || !document.body.contains(BaseChart.sharedTooltip)) {
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
      
      // Add to document.body (outside Vue's control) instead of any container
      document.body.appendChild(BaseChart.sharedTooltip);
    }
    return BaseChart.sharedTooltip;
  }

  // Shared scroll handler system (performance optimization)
  static scrollCharts = new Set();
  static scrollHandlerAttached = false;

  static registerScrollHandler(chart) {
    BaseChart.scrollCharts.add(chart);
    
    if (!BaseChart.scrollHandlerAttached) {
      window.addEventListener('scroll', BaseChart.handleGlobalScroll, { passive: true });
      BaseChart.scrollHandlerAttached = true;
    }
  }

  static unregisterScrollHandler(chart) {
    BaseChart.scrollCharts.delete(chart);
    
    if (BaseChart.scrollCharts.size === 0 && BaseChart.scrollHandlerAttached) {
      window.removeEventListener('scroll', BaseChart.handleGlobalScroll);
      BaseChart.scrollHandlerAttached = false;
    }
  }

  static handleGlobalScroll() {
    // Only update charts that have active tooltips
    BaseChart.scrollCharts.forEach(chart => {
      // Safety check: ensure chart still has valid canvas and state
      if (chart && chart.canvas && chart.currentRegion !== null && chart.lastMouseEvent) {
        try {
          chart.updateTooltipPosition(chart.lastMouseEvent);
        } catch (error) {
          // If chart is in invalid state, remove it from scroll tracking
          console.warn('Removing invalid chart from scroll tracking:', error);
          BaseChart.scrollCharts.delete(chart);
        }
      }
    });
  }

  // Create tooltip element (simple version)
  createTooltip() {
    this.tooltip = BaseChart.getSharedTooltip();
    return this.tooltip;
  }

  // Update tooltip (simple version)
  updateTooltip(event, region) {
    if (this.options.disableTooltips || region === null) {
      this.hideTooltip();
      return;
    }

    const tooltip = BaseChart.getSharedTooltip();
    if (!tooltip) return;

    // Get tooltip content
    const tooltipContent = this.getTooltipContent(region);
    
    if (tooltipContent && typeof tooltipContent === 'object' && tooltipContent.items) {
      // Multi-value tooltip with color spots - use innerHTML for better performance
      let html = '';
      tooltipContent.items.forEach(item => {
        html += `<div style="display: flex; align-items: center; margin: 2px 0; gap: 6px;">`;
        
        if (item.color) {
          html += `<div style="width: 8px; height: 8px; background: ${item.color}; border-radius: 50%; flex-shrink: 0;"></div>`;
        }
        
        html += `<span>${this.escapeHtml(item.label || '')}</span>`;
        html += `</div>`;
      });
      tooltip.innerHTML = html;
    } else {
      // Single value tooltip
      const value = this.values[region];
      const formattedValue = this.formatTooltipValue(value, region);
      const content = `${this.options.tooltipPrefix}${formattedValue}${this.options.tooltipSuffix}`;
      tooltip.textContent = content;
    }

    // Show tooltip
    tooltip.style.display = 'block';
    
    // Use the improved positioning method
    this.updateTooltipPosition(event);
  }

  // Update tooltip position
  updateTooltipPosition(event) {
    const tooltip = BaseChart.getSharedTooltip();
    if (!tooltip || tooltip.style.display === 'none' || !event) return;
    
    try {
      // Use pageX/pageY or calculate from clientX/clientY + scroll offset
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      
      const x = (event.pageX || event.clientX + scrollX) + 10;
      const y = (event.pageY || event.clientY + scrollY) - 10;
      
      // Ensure coordinates are valid numbers
      if (isNaN(x) || isNaN(y)) return;
      
      tooltip.style.left = Math.max(0, x) + 'px';
      tooltip.style.top = Math.max(0, y) + 'px';
    } catch (error) {
      console.warn('Error updating tooltip position:', error);
    }
  }

  // Hide tooltip (simple version)
  hideTooltip() {
    const tooltip = BaseChart.getSharedTooltip();
    if (tooltip) {
      tooltip.style.display = 'none';
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

  // Escape HTML for safe innerHTML usage
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    
    // Hide any active tooltip
    this.hideTooltip();
    
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
    
    // Unregister from shared scroll handler
    BaseChart.unregisterScrollHandler(this);
    
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
    
    // Clear stored mouse event
    this.lastMouseEvent = null;
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
