// OptimizedChartFactory.js
// High-performance factory with object pooling and shared resources for handling large numbers of sparklines

import { BaseChart } from './BaseChart.js';
import { LineChart } from './LineChart.js';
import { BarChart } from './BarChart.js';
import { TriStateChart } from './TriStateChart.js';
import { DiscreteChart } from './DiscreteChart.js';
import { BulletChart } from './BulletChart.js';
import { PieChart } from './PieChart.js';
import { BoxChart } from './BoxChart.js';

// Shared defaults cache - created once and reused
const DEFAULT_CACHE = new Map();

// Processed values cache - reuse expensive computations
const VALUES_CACHE = new Map();
const MAX_CACHE_SIZE = 1000;

// Object pools for reusing chart instances
const CHART_POOLS = new Map();
const MAX_POOL_SIZE = 50;

// Chart type registry
const chartTypes = {
  line: LineChart,
  bar: BarChart,
  tristate: TriStateChart,
  discrete: DiscreteChart,
  bullet: BulletChart,
  pie: PieChart,
  box: BoxChart
};

// Get cached defaults for a chart type
function getCachedDefaults(ChartClass) {
  const className = ChartClass.name;
  if (!DEFAULT_CACHE.has(className)) {
    // Create instance temporarily to get defaults, then cache them
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const tempChart = new ChartClass(tempCtx, { data: [], width: 1, height: 1, options: {} });
    DEFAULT_CACHE.set(className, Object.freeze({ ...tempChart.getDefaults() }));
    tempChart.destroy();
  }
  return DEFAULT_CACHE.get(className);
}

// Generate cache key for processed values
function getValuesCacheKey(data, type) {
  if (!Array.isArray(data) || data.length === 0) return null;
  
  // Create a simple hash for the data + type combination
  const dataStr = data.join(',');
  return `${type}:${dataStr}`;
}

// Get cached processed values or compute and cache them
function getCachedProcessedValues(data, type, ChartClass) {
  const cacheKey = getValuesCacheKey(data, type);
  if (!cacheKey) return [];
  
  if (VALUES_CACHE.has(cacheKey)) {
    return VALUES_CACHE.get(cacheKey);
  }
  
  // Process values using a temporary chart instance
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  const tempChart = new ChartClass(tempCtx, { data, width: 1, height: 1, options: {} });
  const processedValues = [...tempChart.processValues(data)];
  tempChart.destroy();
  
  // Cache with size limit
  if (VALUES_CACHE.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (simple FIFO)
    const firstKey = VALUES_CACHE.keys().next().value;
    VALUES_CACHE.delete(firstKey);
  }
  
  VALUES_CACHE.set(cacheKey, Object.freeze(processedValues));
  return processedValues;
}

// Get or create object pool for chart type
function getChartPool(type) {
  if (!CHART_POOLS.has(type)) {
    CHART_POOLS.set(type, []);
  }
  return CHART_POOLS.get(type);
}

// Get chart from pool or create new one
function getPooledChart(type, ctx, props) {
  const ChartClass = chartTypes[type];
  if (!ChartClass) {
    console.warn(`Chart type "${type}" not supported`);
    return null;
  }
  
  const pool = getChartPool(type);
  let chart;
  
  if (pool.length > 0) {
    // Reuse from pool
    chart = pool.pop();
    chart.reinitialize(ctx, props);
  } else {
    // Create new with optimizations
    const cachedDefaults = getCachedDefaults(ChartClass);
    const processedValues = getCachedProcessedValues(props.data, type, ChartClass);
    
    chart = new ChartClass(ctx, props);
    // Override with cached values to avoid recomputation
    chart.options = { ...cachedDefaults, ...props.options };
    chart.values = processedValues;
    // Use BaseChart's shared tooltip system
    chart.tooltip = BaseChart.getSharedTooltip();
  }
  
  return chart;
}

// Return chart to pool for reuse with proper cleanup
function returnToPool(chart, type) {
  if (!chart) return;
  
  const pool = getChartPool(type);
  if (pool.length < MAX_POOL_SIZE) {
    // CRITICAL: Always call reset() to clean up event handlers
    // This removes all mouse and touch event listeners to prevent memory leaks
    chart.reset(); // Clean up state and event listeners but keep the object
    pool.push(chart);
  } else {
    // Pool is full, completely destroy the chart and all its handlers
    chart.destroy();
  }
}

// Optimized chart factory
export function createChart(type, ctx, props) {
  return getPooledChart(type, ctx, props);
}

// Enhanced destroy function for pooling
export function destroyChart(chart, type) {
  returnToPool(chart, type);
}

// Force immediate cleanup without pooling (for DOM removal scenarios)
export function destroyChartImmediately(chart) {
  if (chart && typeof chart.destroy === 'function') {
    chart.destroy(); // Complete cleanup including all event handlers
  }
}

// Utility functions for memory management
export const ChartOptimizer = {
  // Clear all caches
  clearCaches() {
    VALUES_CACHE.clear();
    DEFAULT_CACHE.clear();
  },
  
  // Clear specific cache
  clearValuesCache() {
    VALUES_CACHE.clear();
  },
  
  // Get cache statistics
  getCacheStats() {
    return {
      defaultsCacheSize: DEFAULT_CACHE.size,
      valuesCacheSize: VALUES_CACHE.size,
      poolSizes: Object.fromEntries(
        Array.from(CHART_POOLS.entries()).map(([type, pool]) => [type, pool.length])
      )
    };
  },
  
  // Pre-warm caches for known chart types and common data
  preWarmCaches(commonDataSets = []) {
    // Pre-load defaults for all chart types
    Object.entries(chartTypes).forEach(([type, ChartClass]) => {
      getCachedDefaults(ChartClass);
    });
    
    // Pre-process common data sets
    commonDataSets.forEach(data => {
      Object.keys(chartTypes).forEach(type => {
        getCachedProcessedValues(data, type, chartTypes[type]);
      });
    });
  },
  
  // Clean up shared resources and ensure no memory leaks
  cleanup() {
    this.clearCaches();
    // Clear all pools and properly destroy all pooled charts
    CHART_POOLS.forEach(pool => {
      pool.forEach(chart => {
        // Ensure complete cleanup of each pooled chart
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      pool.length = 0;
    });
    // Clean up shared tooltip through BaseChart with error handling
    try {
      if (typeof BaseChart.cleanupSharedTooltip === 'function') {
        BaseChart.cleanupSharedTooltip();
      }
    } catch (error) {
      console.warn('SharedTooltip cleanup failed:', error);
    }
  },

  // Validate that chart event handlers are properly cleaned up
  validateCleanup(canvas) {
    if (!canvas || !canvas.getEventListeners) {
      // Browser doesn't support getEventListeners (Chrome DevTools only)
      return { isValid: true, note: 'Cannot validate - getEventListeners not available' };
    }

    const listeners = canvas.getEventListeners();
    const sparklineEvents = ['mousemove', 'mouseleave', 'click', 'touchstart', 'touchmove', 'touchend', 'touchcancel'];
    
    const remainingSparklineListeners = sparklineEvents.filter(event => 
      listeners[event] && listeners[event].length > 0
    );

    if (remainingSparklineListeners.length === 0) {
      return { isValid: true, message: 'All sparkline event handlers properly cleaned up' };
    } else {
      return { 
        isValid: false, 
        message: `Event handlers still attached: ${remainingSparklineListeners.join(', ')}`,
        events: remainingSparklineListeners 
      };
    }
  },

  // Debug method to check current pool status and potential memory issues
  getMemoryReport() {
    const poolSizes = Object.fromEntries(
      Array.from(CHART_POOLS.entries()).map(([type, pool]) => [type, pool.length])
    );

    return {
      defaultsCacheSize: DEFAULT_CACHE.size,
      valuesCacheSize: VALUES_CACHE.size,
      poolSizes,
      totalPooledCharts: Object.values(poolSizes).reduce((a, b) => a + b, 0),
      recommendations: this._getMemoryRecommendations(poolSizes)
    };
  },

  _getMemoryRecommendations(poolSizes) {
    const recommendations = [];
    const totalCharts = Object.values(poolSizes).reduce((a, b) => a + b, 0);
    
    if (totalCharts > MAX_POOL_SIZE * 2) {
      recommendations.push('Consider calling cleanup() - high number of pooled charts');
    }
    
    if (VALUES_CACHE.size > MAX_CACHE_SIZE * 0.8) {
      recommendations.push('Values cache is nearly full - consider clearValuesCache()');
    }
    
    return recommendations;
  }
};

// Export for backwards compatibility
export { createChart as createOptimizedChart };
