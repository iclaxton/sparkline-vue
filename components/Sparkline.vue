<template>
  <canvas ref="canvas" :width="width" :height="height" class="sparkline-canvas"></canvas>
</template>

<script>
import { onMounted, watch, ref, onUnmounted } from 'vue';
import { createChart } from '../renderers/chartFactory.js';
import { createChart as createOptimizedChart, destroyChart } from '../renderers/OptimizedChartFactory.js';

export default {
  name: 'Sparkline',
  props: {
    type: { type: String, default: 'line' },
    data: { type: Array, required: true },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 30 },
    options: { type: Object, default: () => ({}) },
    // Performance optimization mode
    optimized: { type: Boolean, default: false }
  },
  setup(props, { emit }) {
    const canvas = ref(null);
    let chartInstance = null;
    let clickHandler = null;

    const draw = () => {
      if (!canvas.value) return;
      
      // Preserve tooltip state before destroying the previous chart
      let shouldPreserveTooltip = false;
      let tooltipOwnership = null;
      
      if (chartInstance) {
        const tooltip = chartInstance.constructor.getSharedTooltip ? chartInstance.constructor.getSharedTooltip() : null;
        if (tooltip && tooltip._owner === chartInstance.chartId) {
          chartInstance.preserveTooltipState();
          shouldPreserveTooltip = true;
          tooltipOwnership = chartInstance.chartId; // Store the persistent ID
        }
      }
      
      // Clean up previous chart instance
      if (chartInstance) {
        if (props.optimized) {
          destroyChart(chartInstance, props.type); // Returns to pool
        } else if (chartInstance.destroy) {
          chartInstance.destroy(); // Standard cleanup
        }
      }
      
      // Remove previous click handler if it exists - enhanced cleanup
      if (clickHandler && canvas.value) {
        try {
          canvas.value.removeEventListener('sparklineClick', clickHandler);
        } catch (error) {
          console.warn('Error removing previous click handler:', error);
        }
        clickHandler = null;
      }
      
      const ctx = canvas.value.getContext('2d');
      ctx.clearRect(0, 0, props.width, props.height);
      
      // Use optimized or standard factory based on prop
      chartInstance = props.optimized 
        ? createOptimizedChart(props.type, ctx, props)
        : createChart(props.type, ctx, props);
      
      if (chartInstance) {
        chartInstance.draw();
        
        // If we preserved tooltip state, restore ownership and tooltip
        if (shouldPreserveTooltip && tooltipOwnership === chartInstance.chartId) {
          const tooltip = chartInstance.constructor.getSharedTooltip ? chartInstance.constructor.getSharedTooltip() : null;
          if (tooltip) {
            tooltip._owner = chartInstance.chartId; // Restore ownership with persistent ID
          }
        }
        
        // Forward click events - store reference for cleanup
        if (canvas.value) {
          clickHandler = (event) => {
            emit('click', event.detail);
          };
          canvas.value.addEventListener('sparklineClick', clickHandler);
        }
        
        // Schedule tooltip refresh after Vue's DOM updates complete
        setTimeout(() => {
          if (chartInstance && chartInstance.restoreTooltipSmart) {
            chartInstance.restoreTooltipSmart();
          }
        }, 0);
      }
    };

    onMounted(draw);
    watch(() => [props.data, props.options, props.type, props.width, props.height], draw, { deep: true });

    onUnmounted(() => {
      if (chartInstance) {
        if (props.optimized) {
          destroyChart(chartInstance, props.type); // Returns to pool
        } else if (chartInstance.destroy) {
          chartInstance.destroy(); // Standard cleanup
        }
      }
      
      // Clean up Vue-level event listeners with error handling
      if (clickHandler && canvas.value) {
        try {
          canvas.value.removeEventListener('sparklineClick', clickHandler);
        } catch (error) {
          console.warn('Error removing click handler during unmount:', error);
        }
        clickHandler = null;
      }
      
      // Clean up persistent chart ID when component is truly being unmounted
      if (canvas.value && chartInstance && chartInstance.constructor.cleanupCanvasChartId) {
        chartInstance.constructor.cleanupCanvasChartId(canvas.value);
      }
    });

    return { canvas };
  }
};
</script>

<style scoped>
.sparkline-canvas {
  display: block;
  cursor: crosshair;
}

/* .sparkline-canvas:hover {
  border-color: #999;
} */
</style>
