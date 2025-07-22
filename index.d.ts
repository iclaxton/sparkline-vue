import { DefineComponent, App, Plugin } from 'vue'

export interface SparklineProps {
  data: number[]
  type?: 'line' | 'bar' | 'tristate' | 'discrete' | 'bullet' | 'pie' | 'box'
  width?: string | number
  height?: string | number
  lineColor?: string
  fillColor?: string
  spotColor?: string
  minSpotColor?: string
  maxSpotColor?: string
  spotRadius?: number
  barColor?: string
  negBarColor?: string
  barWidth?: number | 'auto'
  barSpacing?: number | 'auto'
  zeroAxis?: boolean
  tooltipPrefix?: string
  tooltipSuffix?: string
  tooltipFormatter?: (sparkline: any, options: any, fields: any) => string
  optimized?: boolean
  options?: Record<string, any>
  [key: string]: any
}

declare const Sparkline: DefineComponent<SparklineProps>

export interface SparklinePluginOptions {
  name?: string
}

declare const SparklinePlugin: Plugin & {
  install(app: App, options?: SparklinePluginOptions): void
}

export default Sparkline
export { Sparkline, SparklinePlugin }
