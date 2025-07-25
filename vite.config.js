import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';


export default defineConfig(({ command, mode }) => {
  const isLibraryBuild = command === 'build' && !process.argv.includes('--mode=docs');
  const isDocsBuild = command === 'build' && mode === 'docs';  
  
  if (isLibraryBuild) {
    // Library build configuration (production mode)
    return {
      plugins: [vue()],
      mode: 'production', // Ensure production mode
      build: {
        lib: {
          entry: resolve(__dirname, 'index.js'),
          name: 'SparklineVue',
          fileName: (format) => `sparkline-vue.${format}.js`,
          formats: ['es', 'umd']
        },
        minify: 'terser', // Enable minification
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue'
            }
          }
        },
        outDir: 'dist'
      },
      define: {
        'process.env.NODE_ENV': '"production"' // Explicitly set NODE_ENV to production
      }
    };
  }
  
  if (isDocsBuild) {
    // Docs build configuration (production mode)
    return {
      base: '/sparkline-vue/', // MUST match your GitHub Pages repo name
      plugins: [vue()],
      mode: 'production', // Ensure production mode
      build: {
        outDir: 'dist-docs',
        minify: 'terser', // Enable minification for better performance
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            basic: resolve(__dirname, 'docs/basic/index.html'),
            advanced: resolve(__dirname, 'docs/advanced/index.html'),
            comprehensive: resolve(__dirname, 'docs/comprehensive/index.html'),
            interactive: resolve(__dirname, 'docs/interactive/index.html'),
            performance: resolve(__dirname, 'docs/performance/index.html'),
            tests: resolve(__dirname, 'docs/tests/index.html'),
            'vue-app': resolve(__dirname, 'docs/vue-app/index.html')
          }
        }
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, '.'),
          '@docs': resolve(__dirname, 'docs'),
          '@components': resolve(__dirname, 'components'),
          '@renderers': resolve(__dirname, 'renderers'),
          '@shared': resolve(__dirname, 'shared'),
          '../renderers/': resolve(__dirname, 'renderers') + '/',
          '../components/': resolve(__dirname, 'components') + '/',
          '/renderers/': resolve(__dirname, 'renderers') + '/',
          '/components/': resolve(__dirname, 'components') + '/',
          'vue': 'vue/dist/vue.esm-bundler.js'
        }
      },
      define: {
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        'process.env.NODE_ENV': '"production"' // Explicitly set NODE_ENV to production
      }
    };
  }
  
  // Development server configuration
  return {
    plugins: [vue()],
    root: '.',
    server: {
      port: 5173,
      host: 'localhost',
      open: '/'
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
        '@docs': resolve(__dirname, 'docs'),
        '@components': resolve(__dirname, 'components'),
        '@renderers': resolve(__dirname, 'renderers'),
        'vue': 'vue/dist/vue.esm-bundler.js'
      }
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    }
  };
});
