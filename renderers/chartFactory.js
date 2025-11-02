// chartFactory.js
// Factory for creating different chart types

/**
 * @fileoverview Simple chart factory for creating chart instances by type
 */

import { LineChart } from './LineChart.js';
import { BarChart } from './BarChart.js';
import { TriStateChart } from './TriStateChart.js';
import { DiscreteChart } from './DiscreteChart.js';
import { BulletChart } from './BulletChart.js';
import { PieChart } from './PieChart.js';
import { BoxChart } from './BoxChart.js';

const chartTypes = {
  line: LineChart,
  bar: BarChart,
  tristate: TriStateChart,
  discrete: DiscreteChart,
  bullet: BulletChart,
  pie: PieChart,
  box: BoxChart
};

/**
 * Create a chart instance of the specified type
 * @param {string} type - Chart type (line, bar, tristate, discrete, bullet, pie, box)
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} props - Chart properties
 * @param {Array} props.data - Chart data
 * @param {number} props.width - Chart width
 * @param {number} props.height - Chart height
 * @param {Object} props.options - Chart options
 * @returns {BaseChart|null} Chart instance or null if type not supported
 */
export function createChart(type, ctx, props) {
  const ChartClass = chartTypes[type];
  if (!ChartClass) {
    console.warn(`Chart type "${type}" not supported`);
    return null;
  }
  
  return new ChartClass(ctx, props);
}

/**
 * Retrieves the default options for a specified chart type.
 * 
 * @param {string} type - The chart type identifier
 * @returns {Object|null} The default options object for the chart type, or null if the type is not supported
 * @throws {void} Logs a warning to console if chart type is not found
 */
export function getDefaultOptions(type) {
  const ChartClass = chartTypes[type];
  if (!ChartClass) {
    console.warn(`Chart type "${type}" not supported`);
    return null;
  }
  
  return ChartClass.getDefaults();
}