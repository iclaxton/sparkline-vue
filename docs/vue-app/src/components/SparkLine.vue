<template>
  <canvas ref="canvas" :width="width" :height="height" class="sparkline-canvas"></canvas>
</template>

<script>
import { onMounted, watch, ref, onUnmounted } from 'vue';
import { createChart } from '/renderers/chartFactory.js';

export default {
  name: 'SparkLine',
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
      
      // Clean up previous chart instance
      if (chartInstance && chartInstance.destroy) {
        chartInstance.destroy();
      }
      
      // Remove previous click handler if it exists
      if (clickHandler && canvas.value) {
        canvas.value.removeEventListener('sparklineClick', clickHandler);
      }
      
      const ctx = canvas.value.getContext('2d');
      ctx.clearRect(0, 0, props.width, props.height);
      chartInstance = createChart(props.type, ctx, props);
      
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
      if (chartInstance && chartInstance.destroy) {
        chartInstance.destroy();
      }
      
      // Clean up Vue-level event listeners
      if (clickHandler && canvas.value) {
        canvas.value.removeEventListener('sparklineClick', clickHandler);
      }
    });

    return { canvas };
  }
};
</script>

<style scoped>
.sparkline-canvas {
  display: block;
  margin: 0 auto;
}
</style>
