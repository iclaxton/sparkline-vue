/**
 * Modern Vue 3 Sparkline component utilities for examples
 * Provides consistent setup and configuration across all examples
 */
import { createApp } from 'vue'
import Sparkline from '../../index.js'

/**
 * Create a standardized Vue app with Sparkline component
 * @param {Object} config - Vue app configuration
 * @returns {Object} Vue app instance
 */
export function createSparklineApp(config = {}) {
  const app = createApp({
    components: {
      'spark-line': Sparkline
    },
    ...config
  })

  // Global error handling
  app.config.errorHandler = (err, instance, info) => {
    console.error('Sparkline Example Error:', err, info)
  }

  app.mount('#app')
  return app
}

/**
 * Common chart configurations for examples
 */
export const chartConfigs = {
  line: {
    basic: {
      lineColor: '#007bff',
      fillColor: 'rgba(0, 123, 255, 0.1)',
      spotRadius: 2
    },
    styled: {
      lineColor: '#e74c3c',
      fillColor: 'rgba(231, 76, 60, 0.1)',
      spotColor: '#c0392b',
      spotRadius: 3,
      lineWidth: 2
    }
  },
  bar: {
    basic: {
      barColor: '#28a745',
      barSpacing: 1,
      barWidth: 'auto'
    },
    posNeg: {
      barColor: '#28a745',
      negBarColor: '#dc3545',
      zeroColor: '#6c757d',
      barSpacing: 1
    }
  },
  interactive: {
    lineColor: '#0066cc',
    fillColor: 'rgba(0, 102, 204, 0.1)',
    spotColor: '#0066cc',
    spotRadius: 3,
    highlightSpotColor: '#ff6600',
    highlightLineColor: '#ff6600',
    tooltipPrefix: 'Value: ',
    tooltipSuffix: ''
  }
}

/**
 * Sample datasets for examples
 */
export const sampleData = {
  line: [5, 10, 8, 15, 12, 20, 18, 25, 22, 30],
  lineWithNulls: [1, 4, null, null, 8, 5, 3, 5],
  bars: [1, 4, 6, 6, 8, 5, 3, 5],
  barsPosNeg: [3, 7, -2, 10, -5, 8, 4, -3, 6, 9],
  tristate: [1, 1, 0, 1, -1, -1, 1, 0, 1],
  discrete: [4, 6, 7, 5, 9, 4, 3, 8],
  pie: [30, 20, 35, 15],
  bullet: [35, 25, 18, 40, 50],
  box: [4, 27, 34, 52, 54, 59, 61, 68, 78, 82, 85]
}

/**
 * Utility to generate random data for dynamic examples
 * @param {number} length - Array length
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array} Random data array
 */
export function generateRandomData(length = 10, min = 0, max = 100) {
  return Array.from({ length }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  )
}
