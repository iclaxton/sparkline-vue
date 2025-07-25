// BaseChart.js
// Base class for all chart types

export class BaseChart {
  // Touch interaction constants
  static TOUCH_OFFSET = 25;        // Offset to clear finger without being excessive
  static TOUCH_SAFETY_BUFFER = 5;  // Small buffer for comfortable viewing
  static TOUCH_TAP_THRESHOLD = 10; // Maximum movement for tap detection
  static TOUCH_TAP_DURATION = 300; // Maximum duration for tap detection
  static TOUCH_TOOLTIP_DELAY = 150; // Delay before hiding tooltip on touch end
  
  // Mouse interaction constants
  static MOUSE_OFFSET = 15;        // Offset for mouse tooltip positioning
  
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
    
  // State preservation for data updates
  this.preservedState = {
    wasTooltipVisible: false,
    lastRegion: null,
    lastMousePosition: null,
    lastRelativePosition: null, // Store position relative to chart
    wasTouch: false // Store touch state
  };
  
  // Persistent ID for this chart instance to track tooltip ownership across redraws
  this.chartId = this.getPersistentChartId(ctx.canvas);
  
  // Track timers for cleanup
  this.timers = new Set();
  
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

  // Get or create a persistent chart ID based on the canvas element
  getPersistentChartId(canvas) {
    // Try to get existing ID from canvas data attribute
    if (canvas.dataset.sparklineChartId) {
      return canvas.dataset.sparklineChartId;
    }
    
    // Create new persistent ID and store it on the canvas
    const persistentId = 'chart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    canvas.dataset.sparklineChartId = persistentId;
    
    return persistentId;
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
      // Only prevent default if the event is cancelable
      if (event.cancelable) {
        event.preventDefault();
      }
      this.isTouch = true;
      touchStartTime = Date.now();
      
      // Touch state tracking for proper event handling
      
      const touch = event.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      
      // Create synthetic mouse event for the chart's mouse handlers
      const syntheticEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pageX: touch.pageX || (touch.clientX + window.pageXOffset),
        pageY: touch.pageY || (touch.clientY + window.pageYOffset),
        target: this.canvas,
        isTouchEvent: true // Mark as touch event for proper positioning
      };
      
      // Create synthetic mouse event for unified handling
      
      // Use the chart's built-in mouse move handler
      this.handleMouseMove(syntheticEvent);
    };

    this.boundHandleTouchMove = (event) => {
      // Only prevent default if the event is cancelable
      if (event.cancelable) {
        event.preventDefault();
      }
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
            target: this.canvas,
            isTouchEvent: true // Mark as touch event for proper positioning
          };
          
          // Process touch movement with synthetic events
          
          // Use the chart's built-in mouse move handler - this should show tooltips
          this.handleMouseMove(syntheticEvent);
        } else {
          // Touch moved outside canvas - hide tooltip
          this.handleMouseLeave();
        }
      }
    };

    this.boundHandleTouchEnd = (event) => {
      // Only prevent default if the event is cancelable
      if (event.cancelable) {
        event.preventDefault();
      }
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // If it was a quick touch (tap) and didn't move much, treat it as a click
      if (touchDuration < BaseChart.TOUCH_TAP_DURATION && touchStartPos && event.changedTouches.length > 0) {
        const touch = event.changedTouches[0];
        const moveDistance = Math.sqrt(
          Math.pow(touch.clientX - touchStartPos.x, 2) + 
          Math.pow(touch.clientY - touchStartPos.y, 2)
        );
        
        // If the touch didn't move much (less than threshold), treat as a click
        if (moveDistance < BaseChart.TOUCH_TAP_THRESHOLD) {
          const syntheticClickEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX || (touch.clientX + window.pageXOffset),
            pageY: touch.pageY || (touch.clientY + window.pageYOffset),
            target: this.canvas,
            isTouchEvent: true // Mark as touch event
          };
          
          // Trigger click handler
          this.handleClick(syntheticClickEvent);
        }
      }
      
      this.isTouch = false;
      touchStartPos = null;
      
      // For touch, keep tooltip visible a bit longer instead of immediately hiding
      // This allows users to see the tooltip before lifting their finger
      const timeoutId = setTimeout(() => {
        if (!this.isTouch) { // Only hide if no new touch started
          this.handleMouseLeave();
        }
        this.timers.delete(timeoutId); // Clean up timer reference
      }, BaseChart.TOUCH_TOOLTIP_DELAY);
      
      // Track the timer for cleanup
      this.timers.add(timeoutId);
    };

    // Add touch event listeners
    this.canvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', this.boundHandleTouchEnd, { passive: false });

    // Store touch state on the chart instance
    this.isTouch = false;
    
    // If this chart is being recreated during an active touch session, restore touch state
    if (this.preservedState.wasTouch) {
      this.isTouch = true;
    }
  }

  // Handle mouse move events
  handleMouseMove(event) {
    if (this.options.disableInteraction) return;

    // Store last mouse event for tooltip refresh capability
    this.lastMouseEvent = event;

    // Store last mouse event for tooltip refresh capability
    this.lastMouseEvent = event;

    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find region for interaction handling
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
    this.lastMouseEvent = null; // Clear stored mouse event
    if (this.currentRegion !== null) {
      this.currentRegion = null;
      this.hideTooltip();
      this.redrawWithHighlight();
      // Clear preserved state when user intentionally moves mouse away
      this.clearPreservedState();
    }
  }

  // Preserve current tooltip state before data updates
  preserveTooltipState() {
    this.preservedState.wasTooltipVisible = this.currentRegion !== null;
    this.preservedState.lastRegion = this.currentRegion;
    this.preservedState.wasTouch = this.isTouch || false; // Preserve touch state
    
    if (this.lastMouseEvent && this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      
      // Validate canvas has valid dimensions
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      
      this.preservedState.lastMousePosition = {
        clientX: this.lastMouseEvent.clientX,
        clientY: this.lastMouseEvent.clientY,
        pageX: this.lastMouseEvent.pageX,
        pageY: this.lastMouseEvent.pageY,
        isTouchEvent: this.lastMouseEvent.isTouchEvent || false // Preserve touch state
      };
      
      // Calculate relative position within the chart
      const relativeX = this.lastMouseEvent.clientX - rect.left;
      const relativeY = this.lastMouseEvent.clientY - rect.top;
      
      // Store relative position with bounds checking
      this.preservedState.lastRelativePosition = {
        x: relativeX,
        y: relativeY,
        ratioX: Math.max(0, Math.min(1, relativeX / rect.width)),
        ratioY: Math.max(0, Math.min(1, relativeY / rect.height))
      };
    }
  }

  // Restore tooltip state after data updates
  restoreTooltipState() {
    if (!this.preservedState.wasTooltipVisible || 
        !this.preservedState.lastRelativePosition || 
        !this.canvas) {
      return false;
    }

    try {
      // Get current canvas position
      const rect = this.canvas.getBoundingClientRect();
      
      // Validate canvas has valid dimensions
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }
      
      // Recreate mouse position from preserved ratios
      const x = this.preservedState.lastRelativePosition.ratioX * rect.width;
      const y = this.preservedState.lastRelativePosition.ratioY * rect.height;
      
      // Validate coordinates are within bounds
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        return false;
      }
      
      // Find the region at the preserved relative position
      const region = this.getNearestRegion(x, y);
      
      if (region !== null) {
        // Calculate page coordinates with scroll offset
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        
        // Reconstruct mouse event for tooltip positioning
        const syntheticEvent = {
          clientX: rect.left + x,
          clientY: rect.top + y,
          pageX: rect.left + x + scrollX,
          pageY: rect.top + y + scrollY,
          target: this.canvas,
          isTouchEvent: this.preservedState.lastMousePosition?.isTouchEvent || false // Restore touch state
        };
        
        this.lastMouseEvent = syntheticEvent;
        this.currentRegion = region;
        
        // Restore touch state if it was preserved
        if (this.preservedState.wasTouch) {
          this.isTouch = true;
        }
        
        this.updateTooltip(syntheticEvent, region);
        this.redrawWithHighlight();
        
        return true;
      }
    } catch (error) {
      console.warn('Error restoring tooltip state:', error);
    }
    
    return false;
  }

  // Refresh tooltip after Vue updates (maintains state)
  refreshTooltip() {
    if (this.currentRegion !== null && this.lastMouseEvent) {
      // Re-trigger tooltip display with stored mouse event
      this.updateTooltip(this.lastMouseEvent, this.currentRegion);
      return true;
    } else {
      // Try to restore from preserved state
      return this.restoreTooltipState();
    }
  }

  // Smart tooltip restoration - finds closest data point after chart updates
  restoreTooltipSmart() {
    if (!this.preservedState.wasTooltipVisible) {
      return false;
    }
    
    if (!this.preservedState.lastRelativePosition) {
      return false;
    }
    
    if (!this.canvas) {
      return false;
    }

    try {
      // Get current canvas position
      const rect = this.canvas.getBoundingClientRect();
      
      // Validate canvas has valid dimensions
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }
      
      // Recreate mouse position from preserved ratios
      const x = this.preservedState.lastRelativePosition.ratioX * rect.width;
      const y = this.preservedState.lastRelativePosition.ratioY * rect.height;
      
      // Validate coordinates are within bounds
      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        return false;
      }
      
      // For charts with preserved data, find the closest available region (more forgiving)
      let region = this.getNearestRegion(x, y);
      
      // If no exact region found, try to find the closest region by x-coordinate
      if (region === null && this.values && this.values.length > 0) {
        // Calculate which data point index the x-coordinate corresponds to
        const dataPointWidth = rect.width / this.values.length;
        const estimatedIndex = Math.round(x / dataPointWidth);
        
        // Clamp to valid range
        region = Math.max(0, Math.min(this.values.length - 1, estimatedIndex));
        
        // Verify this region actually has data
        if (this.values[region] === null || this.values[region] === undefined) {
          // Find nearest valid data point
          for (let offset = 1; offset < this.values.length; offset++) {
            const leftIndex = region - offset;
            const rightIndex = region + offset;
            
            if (leftIndex >= 0 && this.values[leftIndex] !== null && this.values[leftIndex] !== undefined) {
              region = leftIndex;
              break;
            }
            
            if (rightIndex < this.values.length && this.values[rightIndex] !== null && this.values[rightIndex] !== undefined) {
              region = rightIndex;
              break;
            }
          }
        }
      }
      
      if (region !== null && region >= 0 && region < this.values.length) {
        // Calculate page coordinates with scroll offset
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        
        // Reconstruct mouse event for tooltip positioning
        const syntheticEvent = {
          clientX: rect.left + x,
          clientY: rect.top + y,
          pageX: rect.left + x + scrollX,
          pageY: rect.top + y + scrollY,
          target: this.canvas,
          isTouchEvent: this.preservedState.lastMousePosition?.isTouchEvent || false // Restore touch state
        };
        
        this.lastMouseEvent = syntheticEvent;
        this.currentRegion = region;
        
        // Restore touch state if it was preserved
        if (this.preservedState.wasTouch) {
          this.isTouch = true;
        }
        
        // Claim tooltip ownership immediately before updating
        const tooltip = BaseChart.getSharedTooltip();
        if (tooltip) {
          tooltip._owner = this.chartId;
        }
        
        this.updateTooltip(syntheticEvent, region);
        
        // Just draw the highlight without redrawing the chart
        // The chart should have been freshly drawn before this restoration
        if (!this.options.disableHighlight) {
          this.drawHighlight(region);
        }
        
        return true;
      }
    } catch (error) {
      console.warn('Error restoring tooltip state:', error);
    }
    
    return false;
  }

  // Clear preserved tooltip state (call when tooltip is intentionally hidden)
  clearPreservedState() {
    this.preservedState.wasTooltipVisible = false;
    this.preservedState.lastRegion = null;
    this.preservedState.lastMousePosition = null;
    this.preservedState.lastRelativePosition = null;
    this.preservedState.wasTouch = false; // Clear touch state
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
      
      // Initialize tooltip ownership tracking
      BaseChart.sharedTooltip._owner = null;
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
      
      // Initialize tooltip ownership tracking
      BaseChart.sharedTooltip._owner = null;
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
  // Update tooltip (simple version)
  updateTooltip(event, region) {
    if (this.options.disableTooltips || region === null) {
      this.hideTooltip();
      return;
    }

    const tooltip = BaseChart.getSharedTooltip();
    if (!tooltip) return;

    // Claim ownership of the tooltip
    tooltip._owner = this.chartId;

    // Get tooltip content
    const tooltipContent = this.getTooltipContent(region);
    
    if (tooltipContent && typeof tooltipContent === 'object' && tooltipContent.items) {
      // Multi-value tooltip with color spots - use innerHTML for better performance
      let html = '';
      // Multi-value tooltip with color spots - use innerHTML for better performance
      let html = '';
      tooltipContent.items.forEach(item => {
        html += `<div style="display: flex; align-items: center; margin: 2px 0; gap: 6px;">`;
        html += `<div style="display: flex; align-items: center; margin: 2px 0; gap: 6px;">`;
        
        if (item.color) {
          html += `<div style="width: 8px; height: 8px; background: ${item.color}; border-radius: 50%; flex-shrink: 0;"></div>`;
          html += `<div style="width: 8px; height: 8px; background: ${item.color}; border-radius: 50%; flex-shrink: 0;"></div>`;
        }
        
        html += `<span>${this.escapeHtml(item.label || '')}</span>`;
        html += `</div>`;
        html += `<span>${this.escapeHtml(item.label || '')}</span>`;
        html += `</div>`;
      });
      tooltip.innerHTML = html;
      tooltip.innerHTML = html;
    } else {
      // Single value tooltip
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
      // Check if this is actually a touch event (simpler detection)
      const isActualTouch = event.isTouchEvent || false;
      
      let left, top;
      
      if (isActualTouch) {
        // Get tooltip dimensions for better positioning
        const tooltipRect = tooltip.getBoundingClientRect();
        const tooltipWidth = tooltipRect.width || 100; // fallback width
        const tooltipHeight = tooltipRect.height || 30; // fallback height
        
        // Reasonable touch offset - configurable constants
        const touchOffset = BaseChart.TOUCH_OFFSET;
        const safetyBuffer = BaseChart.TOUCH_SAFETY_BUFFER;
        
        // For touch devices: position tooltip offset by reasonable touch distance
        const pageX = event.pageX || (event.clientX + (window.pageXOffset || document.documentElement.scrollLeft || 0));
        const pageY = event.pageY || (event.clientY + (window.pageYOffset || document.documentElement.scrollTop || 0));
        
        // Primary position: left and above finger (more reasonable offset)
        left = pageX - (tooltipWidth + touchOffset);
        top = pageY - (tooltipHeight + touchOffset);
        
        // Prevent tooltip from going off the left edge
        if (left < 10) {
          // Fallback to right side: smaller offset
          left = pageX + touchOffset + safetyBuffer;
        }
        
        // Prevent tooltip from going above viewport
        if (top < 10) {
          // Fallback to below finger: smaller offset
          top = pageY + touchOffset + safetyBuffer;
        }
      } else {
        // For mouse: simple positioning with basic edge detection
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft || 0;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        
        const pageX = event.pageX || (event.clientX + scrollX);
        const pageY = event.pageY || (event.clientY + scrollY);
        
        // Get tooltip dimensions for edge detection
        let tooltipRect = tooltip.getBoundingClientRect();
        let tooltipWidth = tooltipRect.width || 150; // fallback width
        let tooltipHeight = tooltipRect.height || 40; // fallback height
        
        // For multi-line tooltips (like box plots), ensure we have proper dimensions
        if (tooltipRect.width === 0 || tooltipRect.height === 0) {
          // Force a reflow to get accurate dimensions
          tooltip.style.visibility = 'hidden';
          tooltip.style.display = 'block';
          const forcedRect = tooltip.getBoundingClientRect();
          tooltip.style.visibility = 'visible';
          
          if (forcedRect.width > 0 && forcedRect.height > 0) {
            tooltipWidth = forcedRect.width;
            tooltipHeight = forcedRect.height;
          }
        }
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Use overridable method for position calculation
        const position = this.calculateTooltipPosition(pageX, pageY, tooltipWidth, tooltipHeight, viewportWidth, viewportHeight);
        left = position.left;
        top = position.top;
      }
      
      // Ensure coordinates are valid numbers
      if (isNaN(left) || isNaN(top)) return;
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    } catch (error) {
      console.warn('Error updating tooltip position:', error);
    }
  }

  // Default tooltip positioning logic - can be overridden by chart types
  calculateTooltipPosition(pageX, pageY, tooltipWidth, tooltipHeight, viewportWidth, viewportHeight) {
    // Default position: bottom-left corner of tooltip northeast of cursor
    let left = pageX + BaseChart.MOUSE_OFFSET;
    let top = pageY - (tooltipHeight + BaseChart.MOUSE_OFFSET);
    
    // Check if tooltip would go off the right edge
    if (left + tooltipWidth > viewportWidth - 10) {
      // Flip to northwest: bottom-right corner of tooltip northwest of cursor
      left = pageX - (tooltipWidth + BaseChart.MOUSE_OFFSET);
    }
    
    // Check if tooltip would go off the top edge
    if (top < 10) {
      // Move below cursor: top-left corner southeast of cursor
      top = pageY + BaseChart.MOUSE_OFFSET;
    }
    
    // Final boundary checks
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    return { left, top };
  }

  // Hide tooltip (simple version)
  // Hide tooltip (simple version)
  hideTooltip() {
    const tooltip = BaseChart.getSharedTooltip();
    if (!tooltip) return;
    
    // Only hide the tooltip if this chart owns it or if no one owns it
    if (!tooltip._owner || tooltip._owner === this.chartId) {
      tooltip.style.display = 'none';
      tooltip._owner = null;
    const tooltip = BaseChart.getSharedTooltip();
    if (!tooltip) return;
    
    // Only hide the tooltip if this chart owns it or if no one owns it
    if (!tooltip._owner || tooltip._owner === this.chartId) {
      tooltip.style.display = 'none';
      tooltip._owner = null;
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

  // Escape HTML for safe innerHTML usage
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Redraw with highlight
  redrawWithHighlight() {
    // Ensure we have a clean canvas
    this.ctx.save();
    
    try {
      this.ctx.clearRect(0, 0, this.width, this.height);
      
      // Redraw the chart completely
      this.draw();
      
      // Add highlight if needed
      if (this.currentRegion !== null && !this.options.disableHighlight) {
        this.drawHighlight(this.currentRegion);
      }
    } finally {
      // Always restore context state, even if exception occurs
      this.ctx.restore();
    }
    
    this.ctx.restore();
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
    
    // Clear all pending timers to prevent memory leaks
    this.timers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.timers.clear();
    
    // For charts with preserved tooltip state, maintain tooltip ownership temporarily
    const tooltip = BaseChart.getSharedTooltip();
    let preservedTooltipOwnership = false;
    
    if (tooltip && tooltip._owner === this.chartId && this.preservedState.wasTooltipVisible) {
      this.preserveTooltipState();
      preservedTooltipOwnership = true;
      
      // Don't clear ownership here - let the new chart instance with the same persistent ID claim it
      // This maintains continuity across redraws
    } else {
      // Hide any active tooltip (but only if we own it)
      this.hideTooltip();
    }
    
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
    
    // Clear stored mouse event and preserved state
    this.lastMouseEvent = null;
    this.clearPreservedState();
    // Clear stored mouse event and preserved state
    this.lastMouseEvent = null;
    this.clearPreservedState();
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
    
    // Clear any pending timers
    this.timers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.timers.clear();
    
    // Reset canvas cursor
    if (this.canvas) {
      this.canvas.style.cursor = 'default';
    }
    
    // Hide tooltip but don't remove it (for shared tooltip optimization)
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  // Static method to clean up persistent chart ID from canvas (call when canvas is being removed)
  static cleanupCanvasChartId(canvas) {
    if (canvas && canvas.dataset) {
      delete canvas.dataset.sparklineChartId;
    }
  }

  // Static method to clean up shared tooltip (call this when disposing of all charts)
  static cleanupSharedTooltip() {
    if (BaseChart.sharedTooltip && BaseChart.sharedTooltip.parentNode) {
      BaseChart.sharedTooltip.parentNode.removeChild(BaseChart.sharedTooltip);
      BaseChart.sharedTooltip = null;
    }
  }

  // Static method to transfer tooltip ownership (useful during chart recreation)
  static transferTooltipOwnership(fromChartId, toChartId) {
    const tooltip = BaseChart.getSharedTooltip();
    if (tooltip && tooltip._owner === fromChartId) {
      tooltip._owner = toChartId;
      return true;
    }
    return false;
  }

  // Static method to refresh all active tooltips (useful after Vue updates)
  static refreshAllTooltips() {
    BaseChart.scrollCharts.forEach(chart => {
      if (chart && chart.currentRegion !== null && chart.refreshTooltip) {
        chart.refreshTooltip();
      }
    });
  }
}

// Initialize shared tooltip property
BaseChart.sharedTooltip = null;

// Auto-cleanup shared tooltip on page unload
if (typeof window !== 'undefined') {
  const beforeUnloadHandler = () => {
    BaseChart.cleanupSharedTooltip();
  };
  
  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  // Provide cleanup method for SPA environments
  BaseChart.cleanupGlobalListeners = () => {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  };
}
