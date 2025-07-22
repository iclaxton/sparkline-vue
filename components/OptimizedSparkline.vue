<template>
  <canvas ref="canvas" :width="width" :height="height" class="sparkline-canvas"></canvas>
</template>

<script>
import { onMounted, watch, ref, onUnmounted } from 'vue';
import { createChart, destroyChart, destroyChartImmediately } from '../renderers/OptimizedChartFactory.js';

export default {
  name: 'OptimizedSparkline',
  props: {
    type: { type: String, default: 'line' },
    data: { type: Array, required: true },
    width: { type: Number, default: 100 },
    height: { type: Number, default: 30 },
    options: { type: Object, default: () => ({}) }
  },
  setup(props, { emit }) {
    const canvas = ref(null);
    let chartInstance = null;
    let clickHandler = null;

    const draw = () => {
      if (!canvas.value) return;
      
      // Clean up previous chart instance using optimized destroy
      if (chartInstance) {
        destroyChart(chartInstance, props.type); // Returns to pool instead of destroying
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
      chartInstance = createChart(props.type, ctx, props); // May reuse from pool
      
      if (chartInstance) {
        chartInstance.draw();
        
        // Forward click events - store reference for cleanup
        if (canvas.value) {
          clickHandler = (event) => {
            emit('click', event.detail);
          };
          canvas.value.addEventListener('sparklineClick', clickHandler);
        }
      }
    };

    onMounted(draw);
    watch(() => [props.data, props.options, props.type, props.width, props.height], draw, { deep: true });

    onUnmounted(() => {
      // Clean up Vue-level event listeners first with error handling
      if (clickHandler && canvas.value) {
        try {
          canvas.value.removeEventListener('sparklineClick', clickHandler);
        } catch (error) {
          console.warn('Error removing click handler during unmount:', error);
        }
        clickHandler = null;
      }
      
      if (chartInstance) {
        // Use immediate destroy for unmount to ensure complete cleanup
        // This prevents any memory leaks when the component is removed from DOM
        try {
          destroyChartImmediately(chartInstance);
        } catch (error) {
          console.warn('Error destroying chart during unmount:', error);
        }
        chartInstance = null;
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
</style>
