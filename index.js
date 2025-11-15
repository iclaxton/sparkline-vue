// sparkline-vue/index.js
// Entry point for Vue Sparkline (rewritten from jquery.sparkline.js v2.1.2)

import Sparkline from './components/Sparkline.vue';

// Vue plugin installation
const SparklinePlugin = {
  install(app, options = {}) {
    // Register globally
    app.component('Sparkline', Sparkline);
    
    // Optionally register with custom name
    if (options.name) {
      app.component(options.name, Sparkline);
    }
  }
};

// Named exports for modern ES module usage
export { Sparkline, SparklinePlugin };
