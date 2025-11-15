<template>
  <canvas 
    ref="canvas" 
    class="sparkline-canvas"
    role="img"
    :aria-label="`${type} chart with ${data.length} data points`"
  ></canvas>
</template>

<script>
import { onMounted, watch, ref, onUnmounted } from 'vue';
import { createChart } from '../renderers/chartFactory.js';
import { createChart as createOptimizedChart, destroyChart } from '../renderers/OptimizedChartFactory.js';

/**
 * Sparkline Vue Component
 * 
 * A lightweight, versatile sparkline chart component for Vue 3.
 * Supports multiple chart types: line, bar, tristate, discrete, bullet, pie, and box.
 * 
 * @component
 * @example
 * <Sparkline 
 *   :data="[1,2,3,4,5]" 
 *   type="line" 
 *   :width="200" 
 *   :height="50"
 *   :options="{ lineColor: '#00f' }"
 *   @click="handleClick"
 *   @region-change="handleRegionChange"
 * />
 * 
 * @prop {Array} data - Array of numeric data points (required)
 * @prop {String} type - Chart type: 'line', 'bar', 'tristate', 'discrete', 'bullet', 'pie', 'box'
 * @prop {Number} width - Chart width in pixels
 * @prop {Number} height - Chart height in pixels
 * @prop {Object} options - Chart-specific configuration options
 * @prop {Boolean} optimized - Enable object pooling for better performance with many charts
 * 
 * @emits {Object} click - Emitted when a chart region is clicked { region, value, offset }
 * @emits {Object} region-change - Emitted when mouse enters/leaves region { region, previousRegion }
 * 
 * @exposed {Function} refresh - Manually trigger a chart redraw
 * @exposed {Function} getChartInstance - Get the underlying chart instance
 * @exposed {Function} getCanvas - Get the canvas element reference
 */
export default {
  name: 'Sparkline',
  emits: ['click', 'region-change'],
  props: {
    type: { 
      type: String, 
      default: 'line',
      validator: (value) => {
        const validTypes = ['line', 'bar', 'tristate', 'discrete', 'bullet', 'pie', 'box'];
        if (!validTypes.includes(value)) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Invalid chart type "${value}".\n` +
              `Valid types are: ${validTypes.join(', ')}\n` +
              `Fix: Change the 'type' prop to one of the supported chart types.`
            );
          }
          return false;
        }
        return true;
      }
    },
    data: { 
      type: Array, 
      required: true,
      validator: (value) => {
        if (!Array.isArray(value)) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Data prop must be an array, got ${typeof value}.\n` +
              `Fix: Ensure you're passing an array like :data="[1,2,3,4,5]"`
            );
          }
          return false;
        }
        return true;
      }
    },
    width: { 
      type: Number, 
      default: 100,
      validator: (value) => {
        if (typeof value !== 'number' || value <= 0) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Width must be a positive number, got ${value}.\n` +
              `Fix: Set :width="200" or similar positive number.`
            );
          }
          return false;
        }
        return true;
      }
    },
    height: { 
      type: Number, 
      default: 30,
      validator: (value) => {
        if (typeof value !== 'number' || value <= 0) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Height must be a positive number, got ${value}.\n` +
              `Fix: Set :height="50" or similar positive number.`
            );
          }
          return false;
        }
        return true;
      }
    },
    options: { 
      type: Object, 
      default: () => ({}),
      validator: (value) => {
        if (value && typeof value !== 'object') {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Options prop must be an object, got ${typeof value}.\n` +
              `Fix: Pass an object like :options="{ lineColor: '#00f' }"`
            );
          }
          return false;
        }
        return true;
      }
    },
    // Performance optimization mode
    optimized: { type: Boolean, default: false }
  },
  setup(props, { emit, expose }) {
    const canvas = ref(null);
    let chartInstance = null;
    let clickHandler = null;
    let regionChangeHandler = null;

    // SSR/SSG compatibility check
    const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';

    const draw = () => {
      if (!isClient || !canvas.value) return;
      
      // Skip drawing if no data
      if (!props.data || props.data.length === 0) {
        const ctx = canvas.value.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, props.width, props.height);
        }
        return; // Silently skip, no error
      }
      
      // Performance monitoring in development
      const perfStart = process.env.NODE_ENV === 'development' ? performance.now() : 0;
      
      // Use props for dimensions
      const actualWidth = props.width;
      const actualHeight = props.height;
      
      // Validate dimensions - don't proceed if invalid
      if (!actualWidth || !actualHeight || actualWidth <= 0 || actualHeight <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            `[Sparkline] Invalid dimensions, skipping draw.\n` +
            `Width: ${actualWidth}, Height: ${actualHeight}\n` +
            `Fix: Ensure both width and height are positive numbers.`
          );
        }
        return;
      }
      
      // Set canvas backing store dimensions
      canvas.value.width = actualWidth;
      canvas.value.height = actualHeight;
      
      // Preserve tooltip state before destroying the previous chart
      let shouldPreserveTooltip = false;
      let tooltipOwnership = null;
      
      if (chartInstance) {
        const tooltip = chartInstance.constructor.getSharedTooltip ? chartInstance.constructor.getSharedTooltip() : null;
        if (tooltip && tooltip._owner === chartInstance.chartId) {
          chartInstance.preserveTooltipState();
          shouldPreserveTooltip = true;
          tooltipOwnership = chartInstance.chartId;
        }
      }
      
      // Only destroy if type changed
      const typeChanged = chartInstance && chartInstance.type !== props.type;
      
      if (chartInstance && typeChanged) {
        if (props.optimized) {
          destroyChart(chartInstance, chartInstance.type);
        } else if (chartInstance.destroy) {
          chartInstance.destroy();
        }
        chartInstance = null;
      }
      
      const ctx = canvas.value.getContext('2d');
      if (!ctx) {
        if (process.env.NODE_ENV === 'development') {
          console.error(
            `[Sparkline] Failed to get 2D context from canvas.\n` +
            `This may indicate browser compatibility issues or canvas isn't properly mounted.`
          );
        }
        return;
      }
      
      ctx.clearRect(0, 0, actualWidth, actualHeight);
      
      // Create chart with actual dimensions
      const chartProps = {
        data: props.data,
        width: actualWidth,
        height: actualHeight,
        options: props.options
      };
      
      // Create new chart or update existing
      if (!chartInstance) {
        try {
          chartInstance = props.optimized 
            ? createOptimizedChart(props.type, ctx, chartProps)
            : createChart(props.type, ctx, chartProps);
            
          // Add event handlers only once when chart is created
          if (chartInstance && canvas.value) {
            if (!clickHandler) {
              clickHandler = (event) => {
                emit('click', event.detail);
              };
              canvas.value.addEventListener('sparklineClick', clickHandler);
            }
            
            if (!regionChangeHandler) {
              regionChangeHandler = (event) => {
                emit('region-change', event.detail);
              };
              canvas.value.addEventListener('sparklineRegionChange', regionChangeHandler);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Failed to create chart of type "${props.type}".\n` +
              `Error: ${error.message}\n` +
              `Check your data format and options for this chart type.`,
              error
            );
          }
          return;
        }
      } else {
        // Update existing chart with new dimensions and data
        try {
          if (chartInstance.updateDimensions) {
            chartInstance.updateDimensions(actualWidth, actualHeight);
          }
          if (chartInstance.updateData) {
            chartInstance.updateData(props.data);
          }
          if (chartInstance.updateOptions) {
            chartInstance.updateOptions(props.options);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Failed to update chart.\n` +
              `Error: ${error.message}\n` +
              `Attempting to recreate chart...`,
              error
            );
          }
          // If update fails, try to recreate
          chartInstance = null;
          draw();
          return;
        }
      }
      
      if (chartInstance) {
        try {
          chartInstance.draw();
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              `[Sparkline] Failed to draw chart.\n` +
              `Error: ${error.message}`,
              error
            );
          }
        }
        
        // Restore tooltip state
        if (shouldPreserveTooltip && tooltipOwnership === chartInstance.chartId) {
          const tooltip = chartInstance.constructor.getSharedTooltip ? chartInstance.constructor.getSharedTooltip() : null;
          if (tooltip) {
            tooltip._owner = chartInstance.chartId;
          }
        }
        
        // Schedule tooltip refresh
        setTimeout(() => {
          if (chartInstance && chartInstance.restoreTooltipSmart) {
            chartInstance.restoreTooltipSmart();
          }
        }, 0);
      }
      
      // Performance monitoring - log if rendering is slow
      if (process.env.NODE_ENV === 'development') {
        const perfEnd = performance.now();
        const renderTime = perfEnd - perfStart;
        
        if (renderTime > 16) { // Slower than 60fps
          console.warn(
            `[Sparkline Performance] Chart render took ${renderTime.toFixed(2)}ms.\n` +
            `Consider using optimized mode (:optimized="true") for better performance.\n` +
            `Data points: ${props.data.length}, Type: ${props.type}`
          );
        }
      }
    };

    onMounted(() => {
      draw();
    });
    
    watch(() => [props.data, props.options, props.type, props.width, props.height], () => {
      if (canvas.value) {
        draw();
      }
    }, { deep: true, flush: 'post' });
    
    // Watch optimized prop - if it changes, recreate the chart
    watch(() => props.optimized, () => {
      if (canvas.value && chartInstance) {
        // Optimized prop requires chart recreation
        if (props.optimized) {
          destroyChart(chartInstance, chartInstance.type);
        } else if (chartInstance.destroy) {
          chartInstance.destroy();
        }
        chartInstance = null;
        draw();
      }
    });

    onUnmounted(() => {
      // Clean up persistent chart ID BEFORE destroying the chart
      if (canvas.value && chartInstance) {
        try {
          if (chartInstance.constructor && chartInstance.constructor.cleanupCanvasChartId) {
            chartInstance.constructor.cleanupCanvasChartId(canvas.value);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Sparkline: Error cleaning up chart ID during unmount:', error);
          }
        }
      }
      
      // Clean up chart instance
      if (chartInstance) {
        try {
          if (props.optimized) {
            destroyChart(chartInstance, props.type);
          } else if (chartInstance.destroy) {
            chartInstance.destroy();
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Sparkline: Error destroying chart during unmount:', error);
          }
        }
        chartInstance = null;
      }
      
      // Clean up event listeners
      if (clickHandler && canvas.value) {
        try {
          canvas.value.removeEventListener('sparklineClick', clickHandler);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Sparkline: Error removing click handler during unmount:', error);
          }
        }
        clickHandler = null;
      }
      
      if (regionChangeHandler && canvas.value) {
        try {
          canvas.value.removeEventListener('sparklineRegionChange', regionChangeHandler);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Sparkline: Error removing region change handler during unmount:', error);
          }
        }
        regionChangeHandler = null;
      }
    });

    // Expose methods for programmatic control
    expose({
      /**
       * Manually trigger a chart redraw
       * Useful when you need to force a refresh after external changes
       */
      refresh: () => {
        if (isClient) {
          draw();
        }
      },
      
      /**
       * Get the underlying chart instance for advanced usage
       * @returns {Object|null} The chart instance or null if not yet created
       */
      getChartInstance: () => chartInstance,
      
      /**
       * Get the canvas element reference
       * @returns {HTMLCanvasElement|null} The canvas element or null
       */
      getCanvas: () => canvas.value
    });

    return { canvas };
  }
};
</script>

<style scoped>
.sparkline-canvas {
  display: inline-block;
  cursor: crosshair;
  vertical-align: middle;
}
</style>
