import { DefineComponent, App, Plugin } from 'vue'

/**
 * Data type for sparkline charts
 * - Single series: number | null | [x, y] pairs
 * - Multi-series (line charts): Array of arrays [[1,2,3], [4,5,6]]
 */
export type SparklineData = number | null | [number, number]
export type SparklineMultiSeriesData = SparklineData[] | SparklineData[][]

/**
 * Supported chart types
 */
export type ChartType = 'line' | 'bar' | 'tristate' | 'discrete' | 'bullet' | 'pie' | 'box'

/**
 * Chart event detail for click events
 */
export interface SparklineClickEvent {
  region: number | null
  value: number | number[] | null
  offset: { x: number, y: number }
  sparklines?: any[]
}

/**
 * Chart event detail for region change events
 */
export interface SparklineRegionChangeEvent {
  region: number | null
  previousRegion: number | null
}

/**
 * Props for the Sparkline component
 */
export interface SparklineProps {
  /** 
   * Array of numeric data points to visualize.
   * - Single series: [1, 2, 3, 4] or [[x1,y1], [x2,y2]]
   * - Multi-series (line charts): [[1,2,3], [4,5,6], [7,8,9]]
   */
  data: SparklineMultiSeriesData
  
  /** Chart type to render */
  type?: ChartType
  
  /** Width of the chart in pixels */
  width?: number
  
  /** Height of the chart in pixels */
  height?: number
  
  /** 
   * Chart-specific options. See documentation for options available per chart type 
   * @see https://iclaxton.github.io/sparkline-vue/
   */
  options?: SparklineOptions
  
  /**
   * Enable optimized mode with object pooling for better performance with many charts.
   * Uses OptimizedChartFactory for memory efficiency.
   */
  optimized?: boolean
}

/**
 * Configuration options for sparkline charts
 * Common options applicable to all chart types
 */
export interface SparklineOptions {
  // Common options
  /** Line color. For multi-series: array of colors per series or single color for all */
  lineColor?: string | string[]
  /** Fill color. For multi-series: array of colors per series or single color for all */
  fillColor?: string | string[]
  /** Line width. For multi-series: array of widths per series or single width for all */
  lineWidth?: number | number[]
  
  // Multi-series options (line charts)
  /** Names for each series in multi-series charts. Used in tooltips. */
  seriesNames?: string[]
  
  // Spot options (line charts)
  /** Spot color. For multi-series: array of colors per series or single color for all */
  spotColor?: string | string[]
  minSpotColor?: string
  maxSpotColor?: string
  /** Spot radius. For multi-series: array of radii per series or single radius for all */
  spotRadius?: number | number[]
  highlightSpotColor?: string
  highlightLineColor?: string
  
  // Bar chart options
  barColor?: string
  negBarColor?: string
  barWidth?: number | 'auto'
  barSpacing?: number | 'auto'
  zeroAxis?: boolean
  
  // Tristate options
  posBarColor?: string
  zeroBarColor?: string
  
  // Discrete options
  thresholdColor?: string
  thresholdValue?: number
  
  // Bullet options
  targetColor?: string
  performanceColor?: string
  rangeColors?: string[]
  
  // Pie options
  sliceColors?: string[]
  borderWidth?: number
  borderColor?: string
  offset?: number
  
  // Box plot options
  boxLineColor?: string
  boxFillColor?: string
  whiskerColor?: string
  outlierLineColor?: string
  outlierFillColor?: string
  medianColor?: string
  targetColor?: string
  
  // Tooltip options
  disableTooltips?: boolean
  tooltipPrefix?: string
  tooltipSuffix?: string
  tooltipFormat?: string
  tooltipFormatter?: (sparkline: any, options: any, fields: any) => string
  tooltipValueLookups?: Record<string, any>
  tooltipSkipNull?: boolean
  
  // Interaction options
  disableHighlight?: boolean
  disableInteraction?: boolean
  
  // Range options
  chartRangeMin?: number
  chartRangeMax?: number
  chartRangeMinX?: number
  chartRangeMaxX?: number
  normalRangeMin?: number
  normalRangeMax?: number
  normalRangeColor?: string
  drawNormalOnTop?: boolean
  
  // Padding
  topPadding?: number
  bottomPadding?: number
  
  // Additional custom options
  [key: string]: any
}

/**
 * Events emitted by the Sparkline component
 */
export interface SparklineEmits {
  /** Emitted when a chart region is clicked */
  (event: 'click', detail: SparklineClickEvent): void
  
  /** Emitted when mouse enters/leaves a chart region */
  (event: 'region-change', detail: SparklineRegionChangeEvent): void
}

/**
 * Exposed methods for programmatic control
 */
export interface SparklineExposed {
  /** Manually trigger a chart redraw */
  refresh: () => void
  
  /** Get the underlying chart instance for advanced usage */
  getChartInstance: () => any | null
  
  /** Get the canvas element */
  getCanvas: () => HTMLCanvasElement | null
}

/**
 * Sparkline Vue Component
 * 
 * A lightweight, versatile sparkline chart component for Vue 3.
 * Supports 7 chart types with extensive customization options.
 * 
 * @example
 * ```vue
 * <Sparkline 
 *   :data="[1,2,3,4,5]" 
 *   type="line" 
 *   :width="200" 
 *   :height="50"
 *   :options="{ lineColor: '#00f' }"
 *   @click="handleClick"
 *   @region-change="handleRegionChange"
 * />
 * ```
 */
declare const Sparkline: DefineComponent<SparklineProps, SparklineExposed, any, {}, {}, any, any, SparklineEmits>

/**
 * Options for installing the Sparkline plugin
 */
export interface SparklinePluginOptions {
  /** Custom component name to register globally */
  name?: string
}

/**
 * Vue plugin for global registration
 * 
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { SparklinePlugin } from 'sparkline-vue'
 * 
 * const app = createApp(App)
 * app.use(SparklinePlugin)
 * ```
 */
declare const SparklinePlugin: Plugin & {
  install(app: App, options?: SparklinePluginOptions): void
}

export default Sparkline
export { Sparkline, SparklinePlugin }
