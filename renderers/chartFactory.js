// chartFactory.js
// Factory for creating different chart types

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

export function createChart(type, ctx, props) {
  const ChartClass = chartTypes[type];
  if (!ChartClass) {
    console.warn(`Chart type "${type}" not supported`);
    return null;
  }
  
  return new ChartClass(ctx, props);
}
