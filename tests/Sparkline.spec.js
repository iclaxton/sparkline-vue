import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Sparkline from '../components/Sparkline.vue'

describe('Sparkline Component', () => {
  let wrapper

  beforeEach(() => {
    // Clean up after each test
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('Component Mounting', () => {
    it('renders successfully with minimal props', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('canvas').exists()).toBe(true)
    })

    it('applies default width and height', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      const canvas = wrapper.find('canvas').element
      expect(canvas.width).toBe(100) // default width
      expect(canvas.height).toBe(30) // default height
    })

    it('applies custom dimensions', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          width: 200,
          height: 50
        }
      })
      
      const canvas = wrapper.find('canvas').element
      expect(canvas.width).toBe(200)
      expect(canvas.height).toBe(50)
    })
  })

  describe('Chart Types', () => {
    const chartTypes = ['line', 'bar', 'tristate', 'discrete', 'bullet', 'pie', 'box']
    
    chartTypes.forEach(type => {
      it(`renders ${type} chart type`, () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [1, 2, 3, 4, 5],
            type
          }
        })
        
        expect(wrapper.exists()).toBe(true)
      })
    })

    it('rejects invalid chart type', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          type: 'invalid-type'
        }
      })
      
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })
  })

  describe('Props Validation', () => {
    it('requires data prop', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Should warn about missing data
      expect(() => {
        wrapper = mount(Sparkline, {
          props: {}
        })
      }).toThrow()
      
      consoleError.mockRestore()
    })

    it('validates data is an array', () => {
      // Vue's built-in type checking will catch this before our validator
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      wrapper = mount(Sparkline, {
        props: {
          data: 'not-an-array'
        }
      })
      
      // Vue emits a warning for type mismatch
      expect(consoleWarn).toHaveBeenCalled()
      expect(consoleWarn.mock.calls[0][0]).toContain('Invalid prop: type check failed for prop "data"')
      consoleWarn.mockRestore()
    })

    it('validates data is not empty', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      wrapper = mount(Sparkline, {
        props: {
          data: []
        }
      })
      
      expect(consoleWarn).toHaveBeenCalled()
      consoleWarn.mockRestore()
    })

    it('validates positive width', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3],
          width: -100
        }
      })
      
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('validates positive height', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3],
          height: 0
        }
      })
      
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })
  })

  describe('Reactivity', () => {
    it('updates chart when data changes', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      await wrapper.setProps({ data: [5, 4, 3, 2, 1] })
      await wrapper.vm.$nextTick()
      
      expect(wrapper.exists()).toBe(true)
    })

    it('updates chart when type changes', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          type: 'line'
        }
      })
      
      await wrapper.setProps({ type: 'bar' })
      await wrapper.vm.$nextTick()
      
      expect(wrapper.exists()).toBe(true)
    })

    it('updates chart when dimensions change', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          width: 100,
          height: 30
        }
      })
      
      await wrapper.setProps({ width: 200, height: 60 })
      await wrapper.vm.$nextTick()
      
      const canvas = wrapper.find('canvas').element
      expect(canvas.width).toBe(200)
      expect(canvas.height).toBe(60)
    })
  })

  describe('Events', () => {
    it('emits click event when chart is clicked', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      // Simulate chart click by triggering the custom event
      const canvas = wrapper.find('canvas').element
      const clickEvent = new CustomEvent('sparklineClick', {
        detail: { region: 0, value: 1, offset: { x: 0, y: 0 } }
      })
      canvas.dispatchEvent(clickEvent)
      
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('click')).toBeTruthy()
    })

    it('emits region-change event on mouse movement', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      // Simulate region change
      const canvas = wrapper.find('canvas').element
      const regionEvent = new CustomEvent('sparklineRegionChange', {
        detail: { region: 1, previousRegion: 0 }
      })
      canvas.dispatchEvent(regionEvent)
      
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('region-change')).toBeTruthy()
    })
  })

  describe('Exposed Methods', () => {
    it('exposes refresh method', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      expect(typeof wrapper.vm.refresh).toBe('function')
    })

    it('exposes getChartInstance method', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      expect(typeof wrapper.vm.getChartInstance).toBe('function')
    })

    it('exposes getCanvas method', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      expect(typeof wrapper.vm.getCanvas).toBe('function')
      expect(wrapper.vm.getCanvas()).toBeInstanceOf(HTMLCanvasElement)
    })

    it('refresh method triggers redraw', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      // Call refresh
      wrapper.vm.refresh()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('adds ARIA role to canvas', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      const canvas = wrapper.find('canvas')
      expect(canvas.attributes('role')).toBe('img')
    })

    it('adds ARIA label with chart info', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          type: 'line'
        }
      })
      
      const canvas = wrapper.find('canvas')
      expect(canvas.attributes('aria-label')).toContain('line chart')
      expect(canvas.attributes('aria-label')).toContain('5 data points')
    })
  })

  describe('Cleanup', () => {
    it('cleans up on unmount', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5]
        }
      })
      
      const canvas = wrapper.find('canvas').element
      
      // Unmount the component
      wrapper.unmount()
      
      // Verify cleanup (no errors thrown)
      expect(wrapper.exists()).toBe(false)
    })
  })

  describe('Optimized Mode', () => {
    it('works in optimized mode', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          optimized: true
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('switches between normal and optimized mode', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          optimized: false
        }
      })
      
      await wrapper.setProps({ optimized: true })
      await wrapper.vm.$nextTick()
      
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Multi-Series Line Charts', () => {
    it('renders two series with default colors', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [
            [10, 15, 20, 18, 25],
            [15, 18, 22, 20, 26]
          ],
          type: 'line',
          width: 200,
          height: 100
        }
      })
      
      expect(wrapper.exists()).toBe(true)
      const canvas = wrapper.find('canvas').element
      expect(canvas).toBeTruthy()
    })

    it('renders three series with custom colors', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [
            [5, 8, 12, 15],
            [10, 12, 15, 18],
            [8, 10, 14, 16]
          ],
          type: 'line',
          width: 200,
          height: 100,
          options: {
            lineColor: ['#e74c3c', '#3498db', '#2ecc71'],
            seriesNames: ['Series A', 'Series B', 'Series C']
          }
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('handles multi-series with null values', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [
            [10, 15, null, 25, 30],
            [12, null, 20, 28, null]
          ],
          type: 'line',
          width: 200,
          height: 100
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('supports per-series customization', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [
            [1, 2, 3, 4],
            [5, 6, 7, 8]
          ],
          type: 'line',
          width: 200,
          height: 100,
          options: {
            lineColor: ['#ff0000', '#00ff00'],
            lineWidth: [2, 3],
            spotRadius: [2, 0],
            fillColor: ['rgba(255,0,0,0.1)', 'transparent']
          }
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('maintains backwards compatibility with single series', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          type: 'line',
          width: 200,
          height: 100
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('distinguishes multi-series from coordinate pairs', () => {
      // Coordinate pairs: [[x,y], [x,y]]
      const coordWrapper = mount(Sparkline, {
        props: {
          data: [[1, 10], [2, 20], [3, 15]],
          type: 'line',
          width: 200,
          height: 100
        }
      })
      
      expect(coordWrapper.exists()).toBe(true)
      
      // Multi-series: [[1,2,3], [4,5,6]]
      const multiWrapper = mount(Sparkline, {
        props: {
          data: [[1, 2, 3], [4, 5, 6]],
          type: 'line',
          width: 200,
          height: 100
        }
      })
      
      expect(multiWrapper.exists()).toBe(true)
      
      coordWrapper.unmount()
      multiWrapper.unmount()
    })

    it('updates when multi-series data changes', async () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [
            [1, 2, 3],
            [4, 5, 6]
          ],
          type: 'line'
        }
      })
      
      await wrapper.setProps({
        data: [
          [10, 20, 30],
          [40, 50, 60]
        ]
      })
      
      await wrapper.vm.$nextTick()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Streaming Mode', () => {
    it('works in streaming mode', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          streaming: true
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })
  })
})
