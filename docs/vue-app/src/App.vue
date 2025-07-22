<template>
  <div class="outer-container">
    <div class="container">
      <div class="header">
        <h1>🔧 Vue SPA Demo</h1>
        <p>Interactive Vue.js Single Page Application showcasing Sparkline components with reactive data binding</p>
        <div class="nav-links">
          <a href="../../">🏠 Home</a>
          <a href="../basic/">🚀 Basic</a>
          <a href="../advanced/">⚡ Advanced</a>
          <a href="../vue-app/" class="current">🔧 Vue SPA</a>
          <a href="../comprehensive/">🎯 Comprehensive</a>
          <a href="../interactive/">🎮 Interactive</a>
          <a href="../performance/">🚀 Performance</a>
          <a href="https://github.com/iclaxton/sparkline-vue" target="_blank" rel="noopener noreferrer" class="github-link" title="View on GitHub">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>
      </div>
      
      <div class="content">
        <div v-if="error" class="error">
          Error: {{ error }}
        </div>
        
        <div class="intro">
          <h2>Vue.js Integration Examples</h2>
          <p>These examples demonstrate how to use Sparkline Vue components in a real Vue.js application with reactive data, computed properties, and component lifecycle management.</p>
        </div>

        <div class="section">
          <h2>📈 Line Charts</h2>
          <div class="examples-grid">
            <div class="example-card">
              <div class="example-title">Simple Line Chart</div>
              <div class="example-description">
                Basic Vue component integration with reactive data binding and default styling.
              </div>
              <div class="chart-display">
                <span class="chart-label">Stock Prices Over Time</span>
                <spark-line 
                  :data="lineData1" 
                  type="line" 
                  :width="200" 
                  :height="50"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[5,6,7,9,9,5,3,2,2,4,6,7]" 
    type="line" 
    :width="200" 
    :height="50" /&gt;</div>
            </div>

            <div class="example-card">
              <div class="example-title">Line with Custom Options</div>
              <div class="example-description">
                Enhanced line chart with custom spot colors and styling options passed as props.
              </div>
              <div class="chart-display">
                <span class="chart-label">Performance Metrics</span>
                <spark-line 
                  :data="lineData2" 
                  type="line" 
                  :width="200" 
                  :height="50"
                  :options="lineOptions1"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="lineData2" 
    type="line" 
    :options="{ spotRadius: 3, spotColor: '#f80' }" /&gt;</div>
            </div>

            <div class="example-card">
              <div class="example-title">Line with Null Values</div>
              <div class="example-description">
                Handle missing data points gracefully with null values in your data array.
              </div>
              <div class="chart-display">
                <span class="chart-label">Sensor Data with Gaps</span>
                <spark-line 
                  :data="lineData3" 
                  type="line" 
                  :width="200" 
                  :height="50"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[4, 6, null, 7, 8, 4, null, 2, 1]" 
    type="line" /&gt;</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>📊 Bar Charts</h2>
          <div class="examples-grid">
            <div class="example-card">
              <div class="example-title">Basic Bar Chart</div>
              <div class="example-description">
                Simple bar chart component perfect for showing discrete values and comparisons.
              </div>
              <div class="chart-display">
                <span class="chart-label">Monthly Sales</span>
                <spark-line 
                  :data="barData1" 
                  type="bar" 
                  :width="200" 
                  :height="50"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[4,6,7,8,4,3,2,1,4,4]" 
    type="bar" 
    :width="200" 
    :height="50" /&gt;</div>
            </div>

            <div class="example-card">
              <div class="example-title">Positive/Negative Bars</div>
              <div class="example-description">
                Bar chart with both positive and negative values, including custom color mapping.
              </div>
              <div class="chart-display">
                <span class="chart-label">Profit/Loss Analysis</span>
                <spark-line 
                  :data="barData2" 
                  type="bar" 
                  :width="200" 
                  :height="50"
                  :options="barOptions1"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[4,-6,7,-8,-4,3,2,-1]" 
    type="bar" 
    :options="{ colorMap: { '-1': '#fa7', '0': '#555' } }" /&gt;</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>🎯 Specialized Chart Types</h2>
          <div class="examples-grid">
            <div class="example-card">
              <div class="example-title">Tristate Chart</div>
              <div class="example-description">
                Perfect for win/loss/draw scenarios with three distinct states and custom tooltips.
              </div>
              <div class="chart-display">
                <span class="chart-label">Game Results</span>
                <spark-line 
                  :data="tristateData" 
                  type="tristate" 
                  :width="200" 
                  :height="50"
                  :options="{ 
                    tooltipPrefix: 'State: ',
                    tooltipSuffix: ' (1=Win, 0=Draw, -1=Loss)'
                  }"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[1, 1, 0, 1, -1, -1, 1, -1]" 
    type="tristate" 
    :options="{ tooltipPrefix: 'Result: ' }" /&gt;</div>
            </div>

            <div class="example-card">
              <div class="example-title">Discrete Chart</div>
              <div class="example-description">
                Individual data points as vertical lines, great for showing discrete events.
              </div>
              <div class="chart-display">
                <span class="chart-label">Event Timeline</span>
                <spark-line 
                  :data="discreteData" 
                  type="discrete" 
                  :width="200" 
                  :height="50"
                  :options="{ 
                    tooltipPrefix: 'Value: ',
                    tooltipSuffix: ' units'
                  }"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[4,6,7,8,4,3,2,1,4,4]" 
    type="discrete" 
    :options="{ tooltipSuffix: ' events' }" /&gt;</div>
            </div>

            <div class="example-card">
              <div class="example-title">Pie Chart</div>
              <div class="example-description">
                Compact pie chart component for showing proportional data in a circular format.
              </div>
              <div class="chart-display">
                <span class="chart-label">Market Share</span>
                <spark-line 
                  :data="pieData" 
                  type="pie" 
                  :width="80" 
                  :height="80"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[10, 16, 7, 23, 14]" 
    type="pie" 
    :width="80" 
    :height="80" /&gt;</div>
            </div>

            <div class="example-card">
              <div class="example-title">Bullet Chart</div>
              <div class="example-description">
                Performance indicator with target ranges, perfect for KPI dashboards.
              </div>
              <div class="chart-display">
                <span class="chart-label">Goal Progress</span>
                <spark-line 
                  :data="bulletData" 
                  type="bullet" 
                  :width="200" 
                  :height="50"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[10, 12, 14, 18, 20]" 
    type="bullet" 
    :width="200" 
    :height="50" /&gt;</div>
            </div>

            <div class="example-card">
              <div class="example-title">Box Plot</div>
              <div class="example-description">
                Statistical summary showing quartiles, median, and outliers for data distribution.
              </div>
              <div class="chart-display">
                <span class="chart-label">Data Distribution</span>
                <spark-line 
                  :data="boxData" 
                  type="box" 
                  :width="120" 
                  :height="80"
                />
              </div>
              <div class="code-block">&lt;SparkLine 
    :data="[1,2,5,9,0,7,8,2,6,3,5,9]" 
    type="box" 
    :width="120" 
    :height="80" /&gt;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SparkLine from './components/SparkLine.vue'

export default {
  name: 'App',
  components: {
    SparkLine
  },
  data() {
    return {
      error: null,
      lineData1: [8, 4, 0, 0, 0, 0, 1, 4, 4, 10, 10, 10, 10, 0, 0, 0, 4, 6, 5, 9, 10],
      lineData2: [4, -2, -4, 0, 2, 8, 0, 0, 0, 0, 2, 4, 0, 0, 4, 6, 8, 2, 6, 0, 0],
      lineData3: [4, 6, null, 7, 8, 4, 3, 2, 1, null, 4, 7, 8, 9, 7, 6, 4, 3, 2, 1, 0],
      barData1: [4, 6, 7, 8, 4, 3, 2, 1, 4, 4, 7, 8, 9, 7, 6, 4, 3, 2, 1, 0],
      barData2: [4, -6, 7, -8, -4, 3, 2, -1, 4, -4, 7, 8, -9, 7, 6, -4, 3, 2, -1, 0],
      tristateData: [1, 1, 0, 1, -1, -1, 1, -1, 0, 0, 1, 1],
      discreteData: [4, 6, 7, 8, 4, 3, 2, 1, 4, 4, 7, 8, 9, 7, 6, 4, 3, 2, 1, 0],
      pieData: [10, 16, 7, 23, 14],
      bulletData: [10, 12, 14, 18, 20],
      boxData: [1, 2, 5, 9, 0, 7, 8, 2, 6, 3, 5, 9, 1, 7, 8, 9, 2, 6, 4, 1, 3, 7, 8, 2, 6],
      lineOptions1: {
        spotRadius: 3,
        spotColor: '#f80'
      },
      barOptions1: {
        colorMap: {
          '-2': '#fa7',
          '-1': '#fa7',
          '0': '#555'
        }
      }
    }
  },
  errorCaptured(err, instance, info) {
    console.error('Error captured:', err, instance, info)
    this.error = err.message
    return false
  }
}
</script>

<style scoped>

.intro {
  text-align: center;
  margin-bottom: 50px;
}

.intro h2 {
  color: #2c3e50;
  font-size: 2.2em;
  margin-bottom: 15px;
}

.intro p {
  font-size: 1.1em;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.section {
  margin: 50px 0;
}

.section h2 {
  color: #2c3e50;
  font-size: 2.2em;
  margin-bottom: 30px;
  border-bottom: 3px solid #667eea;
  padding-bottom: 10px;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin: 30px 0;
}

@media (max-width: 768px) {
  .examples-grid {
    grid-template-columns: 1fr;
    gap: 20px;
    margin: 20px 0;
  }
}

@media (max-width: 480px) {
  .examples-grid {
    gap: 15px;
    margin: 15px 0;
  }
}

.example-card {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 30px;
  transition: all 0.3s ease;
}

.example-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
}

.example-title {
  font-size: 1.3em;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 15px;
}

.example-description {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.chart-display {
  text-align: center;
  margin: 20px 0;
  padding: 20px;
  background: white;
  border: 1px solid #e3e6ea;
  border-radius: 8px;
}

.chart-label {
  display: block;
  font-size: 0.9em;
  color: #6c757d;
  margin-bottom: 15px;
  font-weight: 600;
}

.code-block {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9em;
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  border-left: 4px solid #667eea;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 12px;
  border-radius: 6px;
  margin: 20px 0;
  text-align: center;
}
</style>
