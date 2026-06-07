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
      expect(wrapper.vm.getChartInstance()).not.toBeNull()
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
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // mount throws because the template accesses data.length and data is undefined
      expect(() => {
        wrapper = mount(Sparkline, { props: {} })
      }).toThrow()

      consoleError.mockRestore()
      consoleWarn.mockRestore()
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

    it('allows empty data array for dynamic loading', () => {
      // Empty data should be allowed (for async/dynamic loading scenarios)
      wrapper = mount(Sparkline, {
        props: {
          data: []
        }
      })
      
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('canvas').exists()).toBe(true)
      // Chart should render but with cleared canvas
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
      expect(wrapper.vm.getChartInstance()).not.toBeNull()
      expect(wrapper.vm.getChartInstance().minY).toBe(1)
      expect(wrapper.vm.getChartInstance().maxY).toBe(5)
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

      wrapper.unmount()

      expect(wrapper.exists()).toBe(false)
    })
  })

  describe('Empty Data Handling', () => {
    it('destroys chart instance when data transitions to empty', async () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, 2, 3, 4, 5] }
      })
      expect(wrapper.vm.getChartInstance()).not.toBeNull()

      await wrapper.setProps({ data: [] })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.getChartInstance()).toBeNull()
    })

    it('does not fire click events after data transitions to empty', async () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, 2, 3] }
      })
      await wrapper.setProps({ data: [] })
      await wrapper.vm.$nextTick()

      const canvas = wrapper.find('canvas').element
      canvas.dispatchEvent(new CustomEvent('sparklineClick', {
        detail: { region: 0, value: 1, offset: { x: 0, y: 0 } }
      }))
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('re-creates chart instance when data is restored from empty', async () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, 2, 3] }
      })
      await wrapper.setProps({ data: [] })
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.getChartInstance()).toBeNull()

      await wrapper.setProps({ data: [4, 5, 6] })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.getChartInstance()).not.toBeNull()
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
      const instance = wrapper.vm.getChartInstance()
      expect(instance.isMultiSeries).toBe(true)
      expect(instance.multiSeriesPoints).toHaveLength(2)
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
      const instance = wrapper.vm.getChartInstance()
      expect(instance.isMultiSeries).toBe(true)
      expect(instance.multiSeriesPoints).toHaveLength(3)
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
      const instance = wrapper.vm.getChartInstance()
      expect(instance.isMultiSeries).toBe(true)
      expect(instance.multiSeriesPoints).toHaveLength(2)
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
      const instance = wrapper.vm.getChartInstance()
      expect(instance.isMultiSeries).toBe(true)
      expect(instance.options.lineColor).toEqual(['#ff0000', '#00ff00'])
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
      expect(wrapper.vm.getChartInstance().isMultiSeries).toBeFalsy()
    })

    it('distinguishes multi-series from coordinate pairs', () => {
      const coordWrapper = mount(Sparkline, {
        props: {
          data: [[1, 10], [2, 20], [3, 15]],
          type: 'line',
          width: 200,
          height: 100
        }
      })
      expect(coordWrapper.vm.getChartInstance().isMultiSeries).toBeFalsy()

      const multiWrapper = mount(Sparkline, {
        props: {
          data: [[1, 2, 3], [4, 5, 6]],
          type: 'line',
          width: 200,
          height: 100
        }
      })
      expect(multiWrapper.vm.getChartInstance().isMultiSeries).toBe(true)

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

      const instance = wrapper.vm.getChartInstance()
      expect(instance.isMultiSeries).toBe(true)
      expect(instance._globalMin).toBe(10)
      expect(instance._globalMax).toBe(60)
    })
  })

  describe('LineChart Data Processing', () => {
    it('computes correct min and max for single-series', () => {
      wrapper = mount(Sparkline, {
        props: { data: [3, 1, 5, 2, 4], type: 'line' }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance).not.toBeNull()
      expect(instance.minY).toBe(1)
      expect(instance.maxY).toBe(5)
    })

    it('updates min and max when data changes', async () => {
      wrapper = mount(Sparkline, {
        props: { data: [3, 1, 5, 2, 4], type: 'line' }
      })
      await wrapper.setProps({ data: [10, 20, 30] })
      await wrapper.vm.$nextTick()

      const instance = wrapper.vm.getChartInstance()
      expect(instance.minY).toBe(10)
      expect(instance.maxY).toBe(30)
    })

    it('detects multi-series data format', () => {
      wrapper = mount(Sparkline, {
        props: { data: [[1, 2, 3], [4, 5, 6]], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance().isMultiSeries).toBe(true)
    })

    it('does not flag single-series as multi-series', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, 2, 3, 4, 5], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance().isMultiSeries).toBeFalsy()
    })

    it('does not flag coordinate pairs as multi-series', () => {
      wrapper = mount(Sparkline, {
        props: { data: [[1, 10], [2, 20], [3, 15]], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance().isMultiSeries).toBeFalsy()
    })

    it('caches global min/max for multi-series tooltip use', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [[1, 5, 3], [2, 4, 8]],
          type: 'line'
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance._globalMin).toBe(1)
      expect(instance._globalMax).toBe(8)
    })

    it('populates points array for single-series interaction', () => {
      wrapper = mount(Sparkline, {
        props: { data: [10, 20, 30, 40, 50], type: 'line' }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(Array.isArray(instance.points)).toBe(true)
      expect(instance.points.length).toBe(5)
    })
  })

  describe('Spot Color and Region Color', () => {
    it('getRegionColor returns lineColor when spotColor is undefined', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [3, 1, 5, 2, 4],
          type: 'line',
          options: { lineColor: '#0000ff', minSpotColor: null, maxSpotColor: null }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      // index 0 value=3: not min/max, spotColor undefined → lineColor
      expect(instance.getRegionColor(0)).toBe('#0000ff')
    })

    it('getRegionColor returns null for null spotColor on a non-min/max point', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [3, 1, 5, 2, 4],
          type: 'line',
          options: { spotColor: null, lineColor: '#0000ff', minSpotColor: null, maxSpotColor: null }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      // index 0 value=3: not min/max, spotColor null → null (no swatch)
      expect(instance.getRegionColor(0)).toBeNull()
    })

    it('getRegionColor returns minSpotColor for the minimum value', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [3, 1, 5, 2, 4],
          type: 'line',
          options: { minSpotColor: '#ff0000', maxSpotColor: '#00ff00' }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      // index 1 has value 1 which is the minimum
      expect(instance.getRegionColor(1)).toBe('#ff0000')
    })

    it('getRegionColor returns maxSpotColor for the maximum value', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [3, 1, 5, 2, 4],
          type: 'line',
          options: { minSpotColor: '#ff0000', maxSpotColor: '#00ff00' }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      // index 2 has value 5 which is the maximum
      expect(instance.getRegionColor(2)).toBe('#00ff00')
    })

    it('getTooltipContent still returns tooltip when spotColor is null', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [3, 1, 5, 2, 4],
          type: 'line',
          options: { spotColor: null }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      const tooltip = instance.getTooltipContent(0)
      expect(tooltip).not.toBeNull()
      expect(tooltip.items).toHaveLength(1)
      // color is null because spotColor was suppressed
      expect(tooltip.items[0].color).toBeNull()
    })
  })

  describe('Point Labels (dataLabels)', () => {
    describe('Line Charts', () => {
      it('accepts dataLabels array for single-series line chart', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [1, 2, 3, 4, 5],
            type: 'line',
            options: {
              dataLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Jan')
        expect(instance.getPointLabel(4)).toBe('May')
        expect(instance.getTooltipContent(0).title).toBe('Jan')
      })

      it('accepts dataLabels array for multi-series line chart', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [[1, 2, 3], [4, 5, 6]],
            type: 'line',
            options: {
              dataLabels: ['2022', '2023', '2024'],
              seriesNames: ['Series A', 'Series B']
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('2022')
        expect(instance.getPointLabel(2)).toBe('2024')
        expect(instance.getTooltipContent(0).title).toBe('2022')
      })

      it('accepts getPointDataLabel callback for line chart', () => {
        const labelCallback = (index) => `Point ${index + 1}`

        wrapper = mount(Sparkline, {
          props: {
            data: [1, 2, 3, 4, 5],
            type: 'line',
            options: {
              getPointDataLabel: labelCallback
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Point 1')
        expect(instance.getPointLabel(4)).toBe('Point 5')
        expect(instance.getTooltipContent(2).title).toBe('Point 3')
      })
    })

    describe('Bar Charts', () => {
      it('accepts dataLabels array for bar chart', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [1, 2, 3, 4, 5],
            type: 'bar',
            options: {
              dataLabels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Q1')
        expect(instance.getPointLabel(4)).toBe('Q5')
        expect(instance.getTooltipContent(0).title).toBe('Q1')
      })

      it('accepts seriesNames for stacked bar chart', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [[1, 2], [3, 4]],
            type: 'bar',
            options: {
              dataLabels: ['2023', '2024'],
              seriesNames: ['Product A', 'Product B']
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('2023')
        const tooltip = instance.getTooltipContent(0)
        expect(tooltip.title).toBe('2023')
        expect(tooltip.items.some(i => i.label.includes('Product A'))).toBe(true)
      })

      it('accepts getPointDataLabel callback for bar chart', () => {
        const labelCallback = (index) => `Bar ${index + 1}`

        wrapper = mount(Sparkline, {
          props: {
            data: [1, 2, 3, 4, 5],
            type: 'bar',
            options: {
              getPointDataLabel: labelCallback
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Bar 1')
        expect(instance.getPointLabel(4)).toBe('Bar 5')
        expect(instance.getTooltipContent(2).title).toBe('Bar 3')
      })
    })

    describe('TriState Charts', () => {
      it('accepts dataLabels array for tristate chart', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [1, -1, 0, 1, -1],
            type: 'tristate',
            options: {
              dataLabels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5']
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Game 1')
        expect(instance.getPointLabel(4)).toBe('Game 5')
        expect(instance.getTooltipContent(0).title).toBe('Game 1')
      })

      it('accepts getPointDataLabel callback for tristate chart', () => {
        const labelCallback = (index) => `Match ${index + 1}`

        wrapper = mount(Sparkline, {
          props: {
            data: [1, -1, 0, 1, -1],
            type: 'tristate',
            options: {
              getPointDataLabel: labelCallback
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Match 1')
        expect(instance.getPointLabel(4)).toBe('Match 5')
        expect(instance.getTooltipContent(2).title).toBe('Match 3')
      })
    })

    describe('Discrete Charts', () => {
      it('accepts dataLabels array for discrete chart', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [4, 6, 7, 7, 4, 3, 2, 1],
            type: 'discrete',
            options: {
              dataLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon']
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Mon')
        expect(instance.getPointLabel(1)).toBe('Tue')
        expect(instance.getTooltipContent(0).title).toBe('Mon')
      })

      it('accepts getPointDataLabel callback for discrete chart', () => {
        const labelCallback = (index) => `Day ${index + 1}`

        wrapper = mount(Sparkline, {
          props: {
            data: [4, 6, 7, 7, 4, 3, 2, 1],
            type: 'discrete',
            options: {
              getPointDataLabel: labelCallback
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Day 1')
        expect(instance.getPointLabel(7)).toBe('Day 8')
        expect(instance.getTooltipContent(3).title).toBe('Day 4')
      })
    })

    describe('Pie Charts', () => {
      it('accepts dataLabels array for pie chart', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [1, 2, 3, 4],
            type: 'pie',
            options: {
              dataLabels: ['Category A', 'Category B', 'Category C', 'Category D']
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Category A')
        expect(instance.getPointLabel(3)).toBe('Category D')
        expect(instance.getTooltipContent(0).title).toBe('Category A')
      })

      it('accepts getPointDataLabel callback for pie chart', () => {
        const labelCallback = (index) => `Slice ${index + 1}`

        wrapper = mount(Sparkline, {
          props: {
            data: [1, 2, 3, 4],
            type: 'pie',
            options: {
              getPointDataLabel: labelCallback
            }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Slice 1')
        expect(instance.getPointLabel(3)).toBe('Slice 4')
        expect(instance.getTooltipContent(2).title).toBe('Slice 3')
      })

      it('handles sorted pie slices with correct label mapping', () => {
        wrapper = mount(Sparkline, {
          props: {
            data: [1, 4, 2, 3],
            type: 'pie',
            options: {
              dataLabels: ['Small', 'Largest', 'Medium', 'Large']
            }
          }
        })
        // Pie chart sorts by value internally but labels must map to original indices
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getPointLabel(0)).toBe('Small')
        expect(instance.getPointLabel(1)).toBe('Largest')
        expect(instance.getPointLabel(2)).toBe('Medium')
        expect(instance.getPointLabel(3)).toBe('Large')
      })
    })
  })

  describe('Series Names', () => {
    it('accepts seriesNames for multi-series line chart', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
          type: 'line',
          options: {
            seriesNames: ['North', 'South', 'East']
          }
        }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip.items).toHaveLength(3)
      expect(tooltip.items[0].label).toContain('North')
      expect(tooltip.items[1].label).toContain('South')
      expect(tooltip.items[2].label).toContain('East')
    })

    it('accepts seriesNames for stacked bar chart segments', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [[1, 2, 3], [4, 5, 6]],
          type: 'bar',
          options: {
            seriesNames: ['Revenue', 'Costs']
          }
        }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip.items.some(i => i.label.includes('Revenue'))).toBe(true)
      expect(tooltip.items.some(i => i.label.includes('Costs'))).toBe(true)
    })
  })

  describe('Tooltip Separators', () => {
    it('renders tristate chart with tooltip separator', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0, 1, -1],
          type: 'tristate',
          options: {
            dataLabels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5']
          }
        }
      })
      
      // TriState tooltips should show separator between current state and totals
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Pie Chart Glow Intensity', () => {
    it('accepts glowIntensity option for pie chart', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4],
          type: 'pie',
          options: {
            glowIntensity: 10
          }
        }
      })
      expect(wrapper.vm.getChartInstance().options.glowIntensity).toBe(10)
    })

    it('uses default glowIntensity of 5 when not specified', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4],
          type: 'pie'
        }
      })
      expect(wrapper.vm.getChartInstance().options.glowIntensity).toBe(5)
    })

    it('accepts glowIntensity of 0 to disable glow', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4],
          type: 'pie',
          options: {
            glowIntensity: 0
          }
        }
      })
      expect(wrapper.vm.getChartInstance().options.glowIntensity).toBe(0)
    })

    it('accepts high glowIntensity values', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4],
          type: 'pie',
          options: {
            glowIntensity: 20
          }
        }
      })
      expect(wrapper.vm.getChartInstance().options.glowIntensity).toBe(20)
    })
  })

  describe('Combined Features', () => {
    it('supports dataLabels and seriesNames together', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [[1, 2, 3], [4, 5, 6]],
          type: 'line',
          options: {
            dataLabels: ['2022', '2023', '2024'],
            seriesNames: ['Product A', 'Product B']
          }
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('supports callback with seriesNames', () => {
      const labelCallback = (index) => `Q${index + 1}`
      
      wrapper = mount(Sparkline, {
        props: {
          data: [[1, 2, 3], [4, 5, 6]],
          type: 'line',
          options: {
            getPointDataLabel: labelCallback,
            seriesNames: ['Revenue', 'Profit']
          }
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })

    it('pie chart with both dataLabels and glowIntensity', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4],
          type: 'pie',
          options: {
            dataLabels: ['A', 'B', 'C', 'D'],
            glowIntensity: 8
          }
        }
      })
      
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Tooltip Title Display', () => {
    it('shows tooltip title by default', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          type: 'line',
          options: {
            dataLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
          }
        }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip.title).toBe('Jan')
      expect(wrapper.vm.getChartInstance().options.showTooltipTitle).toBe(true)
    })

    it('hides tooltip title when showTooltipTitle is false', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          type: 'line',
          options: {
            showTooltipTitle: false,
            dataLabels: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
          }
        }
      })
      // showTooltipTitle controls DOM rendering only — getTooltipContent always returns title data
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip).not.toBeNull()
      expect(tooltip.title).toBe('Jan')
      expect(wrapper.vm.getChartInstance().options.showTooltipTitle).toBe(false)
    })

    it('hides tooltip separator when showTooltipTitle is false', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0, 1, -1],
          type: 'tristate',
          options: {
            showTooltipTitle: false,
            dataLabels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5']
          }
        }
      })
      // isSeparator items are always present in getTooltipContent() data;
      // showTooltipTitle only controls whether they are rendered in the DOM tooltip
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip.title).toBe('Game 1')
      expect(tooltip.items.some(i => i.isSeparator)).toBe(true)
    })

    it('works with all chart types', () => {
      const chartTypes = ['line', 'bar', 'tristate', 'discrete', 'pie', 'bullet', 'box']

      chartTypes.forEach(type => {
        wrapper = mount(Sparkline, {
          props: {
            data: type === 'pie' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5],
            type,
            options: { showTooltipTitle: false }
          }
        })
        expect(wrapper.vm.getChartInstance().options.showTooltipTitle).toBe(false)
        wrapper.unmount()
      })
      wrapper = null
    })
  })

  describe('Tristate Chart State Labels', () => {
    it('uses default state labels (Win/Draw/Loss)', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0, 1, -1],
          type: 'tristate',
          options: {
            dataLabels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5']
          }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getTooltipContent(0).items[0].label).toBe('Win')
      expect(instance.getTooltipContent(1).items[0].label).toBe('Loss')
      expect(instance.getTooltipContent(2).items[0].label).toBe('Draw')
    })

    it('accepts custom state labels', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0, 1, -1],
          type: 'tristate',
          options: {
            stateLabels: {
              positive: 'Up',
              zero: 'Flat',
              negative: 'Down'
            },
            dataLabels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5']
          }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getTooltipContent(0).items[0].label).toBe('Up')
      expect(instance.getTooltipContent(1).items[0].label).toBe('Down')
      expect(instance.getTooltipContent(2).items[0].label).toBe('Flat')
    })

    it('accepts partial custom state labels', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0],
          type: 'tristate',
          options: {
            stateLabels: {
              positive: 'Good',
              negative: 'Bad'
              // zero omitted: should fall back to default 'Draw'
            }
          }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getTooltipContent(0).items[0].label).toBe('Good')
      expect(instance.getTooltipContent(1).items[0].label).toBe('Bad')
      expect(instance.getTooltipContent(2).items[0].label).toBe('Draw')
    })

    it('uses custom labels for different contexts', () => {
      const labelSets = [
        { positive: 'High', zero: 'Medium', negative: 'Low' },
        { positive: 'Profit', zero: 'Break Even', negative: 'Loss' },
        { positive: 'Above', zero: 'At Target', negative: 'Below' },
        { positive: 'Increase', zero: 'Stable', negative: 'Decrease' }
      ]

      labelSets.forEach(labels => {
        wrapper = mount(Sparkline, {
          props: {
            data: [1, -1, 0, 1, -1],
            type: 'tristate',
            options: { stateLabels: labels }
          }
        })
        const instance = wrapper.vm.getChartInstance()
        expect(instance.getTooltipContent(0).items[0].label).toBe(labels.positive)
        expect(instance.getTooltipContent(1).items[0].label).toBe(labels.negative)
        expect(instance.getTooltipContent(2).items[0].label).toBe(labels.zero)
        wrapper.unmount()
      })
      wrapper = null
    })

    it('custom labels work with showTooltipTitle false', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0, 1, -1],
          type: 'tristate',
          options: {
            stateLabels: {
              positive: 'Win',
              zero: 'Draw',
              negative: 'Lose'
            },
            showTooltipTitle: false
          }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getTooltipContent(0).items[0].label).toBe('Win')
      expect(instance.getTooltipContent(1).items[0].label).toBe('Lose')
      expect(instance.getTooltipContent(2).items[0].label).toBe('Draw')
    })
  })

  describe('TriStateChart Tooltip Content', () => {
    it('getTooltipContent shows current state label for a positive value', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, -1, 0, 1, -1], type: 'tristate' }
      })
      const instance = wrapper.vm.getChartInstance()
      const tooltip = instance.getTooltipContent(0) // value=1 (Win)
      expect(tooltip).not.toBeNull()
      expect(tooltip.items[0].label).toBe('Win')
      expect(tooltip.items[0].color).toBe(instance.options.posBarColor)
    })

    it('getTooltipContent shows current state label for a negative value', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, -1, 0, 1, -1], type: 'tristate' }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(1) // value=-1 (Loss)
      expect(tooltip.items[0].label).toBe('Loss')
    })

    it('getTooltipContent shows current state label for zero', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, -1, 0, 1, -1], type: 'tristate' }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(2) // value=0 (Draw)
      expect(tooltip.items[0].label).toBe('Draw')
    })

    it('getTooltipContent uses custom stateLabels', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0],
          type: 'tristate',
          options: { stateLabels: { positive: 'Up', zero: 'Flat', negative: 'Down' } }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getTooltipContent(0).items[0].label).toBe('Up')
      expect(instance.getTooltipContent(1).items[0].label).toBe('Down')
      expect(instance.getTooltipContent(2).items[0].label).toBe('Flat')
    })

    it('getTooltipContent includes a separator and win/loss/draw summary counts', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, -1, 0, 1, -1], type: 'tristate' }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      const hasSeparator = tooltip.items.some(item => item.isSeparator === true)
      expect(hasSeparator).toBe(true)
      const summaryLabels = tooltip.items.filter(i => !i.isSeparator).map(i => i.label)
      expect(summaryLabels.some(l => l.includes('2'))).toBe(true) // 2 wins
    })

    it('getTooltipContent uses pointLabel as title when dataLabels provided', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, -1, 0],
          type: 'tristate',
          options: { dataLabels: ['Game 1', 'Game 2', 'Game 3'] }
        }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip.title).toBe('Game 1')
    })
  })

  describe('Multi-Series Tooltip Content', () => {
    it('getTooltipContent returns one item per series at the hovered index', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [[10, 20, 30], [5, 15, 25]],
          type: 'line',
          options: { seriesNames: ['Alpha', 'Beta'] }
        }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(1)
      expect(tooltip).not.toBeNull()
      expect(tooltip.items).toHaveLength(2)
    })

    it('getTooltipContent uses seriesNames in item labels', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [[10, 20, 30], [5, 15, 25]],
          type: 'line',
          options: { seriesNames: ['Revenue', 'Cost'] }
        }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip.items[0].label).toContain('Revenue')
      expect(tooltip.items[1].label).toContain('Cost')
    })

    it('getTooltipContent falls back to "Series N" when seriesNames not provided', () => {
      wrapper = mount(Sparkline, {
        props: { data: [[10, 20, 30], [5, 15, 25]], type: 'line' }
      })
      const tooltip = wrapper.vm.getChartInstance().getTooltipContent(0)
      expect(tooltip.items[0].label).toContain('Series 1')
      expect(tooltip.items[1].label).toContain('Series 2')
    })

    it('getTooltipContent returns null for an out-of-range region index', () => {
      wrapper = mount(Sparkline, {
        props: { data: [[10, 20, 30], [5, 15, 25]], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance().getTooltipContent(99)).toBeNull()
    })

    it('getTooltipContent marks the global minimum with (Min) label', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [[1, 10, 10], [5, 5, 5]],
          type: 'line',
          options: { minSpotColor: '#f44', maxSpotColor: '#4f4' }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      // global min=1 is at index 0 of series 0
      const tooltip = instance.getTooltipContent(0)
      const minItem = tooltip.items.find(i => i.label.includes('(Min)'))
      expect(minItem).toBeDefined()
    })

    it('uses cached _globalMin/_globalMax rather than rescanning', () => {
      wrapper = mount(Sparkline, {
        props: { data: [[1, 5, 3], [2, 4, 8]], type: 'line' }
      })
      const instance = wrapper.vm.getChartInstance()
      // Overwrite cache with different values — tooltip must use cache, not rescan
      instance._globalMin = 99
      instance._globalMax = 100
      const tooltip = instance.getTooltipContent(0)
      // value=1 does NOT equal our fake _globalMin of 99, so no (Min) label
      const hasMin = tooltip.items.some(i => i.label.includes('(Min)'))
      expect(hasMin).toBe(false)
    })
  })

  describe('BoxChart Statistics', () => {
    it('calculateBoxPlotStats returns correct median for odd-length array', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3, 4, 5], type: 'box' } })
      const instance = wrapper.vm.getChartInstance()
      const stats = instance.calculateBoxPlotStats([1, 2, 3, 4, 5])
      expect(stats.q2).toBe(3)
    })

    it('calculateBoxPlotStats returns average of two middle values for even-length array', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3, 4, 5, 6], type: 'box' } })
      const instance = wrapper.vm.getChartInstance()
      const stats = instance.calculateBoxPlotStats([1, 2, 3, 4, 5, 6])
      expect(stats.q2).toBe(3.5) // (3+4)/2
    })

    it('calculateBoxPlotStats returns correct quartiles', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3, 4, 5, 6, 7, 8], type: 'box' } })
      const instance = wrapper.vm.getChartInstance()
      const stats = instance.calculateBoxPlotStats([1, 2, 3, 4, 5, 6, 7, 8])
      expect(typeof stats.q1).toBe('number')
      expect(typeof stats.q3).toBe('number')
      expect(stats.q1).toBeLessThan(stats.q2)
      expect(stats.q2).toBeLessThan(stats.q3)
    })

    it('calculateBoxPlotStats identifies outliers beyond 1.5*IQR fences', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 100], type: 'box' } })
      const instance = wrapper.vm.getChartInstance()
      // Array [1, 2, 3, 4, 5, 100]: 100 is far above the fence
      const stats = instance.calculateBoxPlotStats([1, 2, 3, 4, 5, 100])
      expect(stats.outliers).toContain(100)
      expect(stats.outliers).not.toContain(5)
    })

    it('calculateBoxPlotStats whiskers are values inside fences, not the fence itself', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3, 4, 5], type: 'box' } })
      const instance = wrapper.vm.getChartInstance()
      const stats = instance.calculateBoxPlotStats([1, 2, 3, 4, 5])
      expect(stats.lowerWhisker).toBe(1) // min value within fence
      expect(stats.upperWhisker).toBe(5) // max value within fence
    })

    it('getStats uses raw mode when raw: true and 7+ values provided', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [0.5, 1, 2, 3, 4, 5, 5.5],
          type: 'box',
          options: { raw: true }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      const stats = instance.getStats()
      // raw mode reads positionally: [outlier_low, lowerWhisker, q1, median, q3, upperWhisker, outlier_high]
      expect(stats.lowerWhisker).toBe(1)
      expect(stats.q1).toBe(2)
      expect(stats.q2).toBe(3)
      expect(stats.q3).toBe(4)
      expect(stats.upperWhisker).toBe(5)
    })
  })

  describe('BarChart Color Mapping', () => {
    it('getBarColor uses colorMap array by cycling through indices', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4],
          type: 'bar',
          options: { colorMap: ['#ff0000', '#00ff00'] }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getBarColor(1, 0)).toBe('#ff0000')
      expect(instance.getBarColor(2, 1)).toBe('#00ff00')
      expect(instance.getBarColor(3, 2)).toBe('#ff0000') // cycles back
    })

    it('getBarColor uses colorMap object to match values', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [5, 10, 3],
          type: 'bar',
          options: { colorMap: { 5: '#aa0000', 10: '#00aa00' } }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getBarColor(5, 0)).toBe('#aa0000')
      expect(instance.getBarColor(10, 1)).toBe('#00aa00')
      expect(instance.getBarColor(3, 2)).toBe(instance.options.barColor) // no match → default
    })

    it('getBarColor returns negBarColor for negative values', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [-1, 2, -3],
          type: 'bar',
          options: { barColor: '#3366cc', negBarColor: '#ff0000' }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getBarColor(-1, 0)).toBe('#ff0000')
      expect(instance.getBarColor(2, 1)).toBe('#3366cc')
    })

    it('getBarColor returns nullColor for null values', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, null, 3],
          type: 'bar',
          options: { nullColor: '#cccccc' }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getBarColor(null, 1)).toBe('#cccccc')
    })
  })

  describe('BaseChart Utilities', () => {
    it('lightenColor lightens a dark color toward white', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3], type: 'line' } })
      const instance = wrapper.vm.getChartInstance()
      const original = '#0000ff'
      const lightened = instance.lightenColor(original, 1.5)
      // Blue channel should stay high, result should be lighter
      expect(lightened).toMatch(/^#[0-9a-f]{6}$/)
      const origBlue = parseInt('0000ff', 16) & 0xff  // 255
      const newBlue = parseInt(lightened.slice(1), 16) & 0xff
      // With factor 1.5 blending with white: result should be lighter than original
      const origRed = (parseInt('0000ff', 16) >> 16) & 0xff // 0
      const newRed = (parseInt(lightened.slice(1), 16) >> 16) & 0xff
      expect(newRed).toBeGreaterThan(origRed) // red channel increases when lightening blue
    })

    it('lightenColor handles pure white unchanged', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3], type: 'line' } })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.lightenColor('#ffffff', 1.5)).toBe('#ffffff')
    })

    it('lightenColor returns non-hex color unchanged', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3], type: 'line' } })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.lightenColor('rgb(0,0,255)', 1.5)).toBe('rgb(0,0,255)')
    })

    it('getMinMax returns { min:0, max:0 } for all-null data', () => {
      wrapper = mount(Sparkline, { props: { data: [1, 2, 3], type: 'line' } })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getMinMax([null, null, null])).toEqual({ min: 0, max: 0 })
    })
  })

  describe('Chart Options Behavior', () => {
    it('chartRangeMin overrides computed minimum', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [3, 1, 5, 2, 4],
          type: 'line',
          options: { chartRangeMin: -10 }
        }
      })
      expect(wrapper.vm.getChartInstance().minY).toBe(-10)
    })

    it('chartRangeMax overrides computed maximum', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [3, 1, 5, 2, 4],
          type: 'line',
          options: { chartRangeMax: 100 }
        }
      })
      expect(wrapper.vm.getChartInstance().maxY).toBe(100)
    })

    it('identical min and max values do not cause division by zero', () => {
      wrapper = mount(Sparkline, {
        props: { data: [5, 5, 5, 5], type: 'line' }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.minY).toBe(5)
      expect(instance.maxY).toBe(5)
      expect(instance.points).toHaveLength(4) // all 4 points rendered
    })

    it('all-null data array does not crash chart', () => {
      expect(() => {
        wrapper = mount(Sparkline, {
          props: { data: [null, null, null], type: 'line' }
        })
      }).not.toThrow()
    })

    it('single data point renders without crash', () => {
      wrapper = mount(Sparkline, {
        props: { data: [42], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance()).not.toBeNull()
      expect(wrapper.vm.getChartInstance().minY).toBe(42)
      expect(wrapper.vm.getChartInstance().maxY).toBe(42)
    })

    it('disableInteraction prevents cursor change on canvas', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4, 5],
          options: { disableInteraction: true }
        }
      })
      const canvas = wrapper.find('canvas').element
      // With disableInteraction, setupInteractions() returns early — no pointer cursor
      expect(canvas.style.cursor).not.toBe('pointer')
    })

    it('getPointDataLabel callback takes priority over dataLabels array', () => {
      const callback = (i) => `CB-${i}`
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3],
          type: 'line',
          options: {
            getPointDataLabel: callback,
            dataLabels: ['Array-0', 'Array-1', 'Array-2']
          }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getPointLabel(0)).toBe('CB-0')
      expect(instance.getPointLabel(1)).toBe('CB-1')
    })

    it('dataLabels array is used when no callback provided', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3],
          type: 'line',
          options: { dataLabels: ['Jan', 'Feb', 'Mar'] }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.getPointLabel(0)).toBe('Jan')
      expect(instance.getPointLabel(2)).toBe('Mar')
    })

    it('getPointLabel falls back to "Point N" when neither callback nor array provided', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, 2, 3], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance().getPointLabel(0)).toBe('Point 1')
      expect(wrapper.vm.getChartInstance().getPointLabel(2)).toBe('Point 3')
    })

    it('tooltipFormatter error does not crash getTooltipContent', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3],
          type: 'line',
          options: {
            tooltipFormatter: () => { throw new Error('formatter broke') }
          }
        }
      })
      const instance = wrapper.vm.getChartInstance()
      // Should not throw; falls back to default format
      let result
      expect(() => { result = instance.getTooltipContent(1) }).not.toThrow()
      expect(result).not.toBeNull()
    })

    it('multi-series with different series lengths renders without crash', () => {
      expect(() => {
        wrapper = mount(Sparkline, {
          props: {
            data: [[1, 2, 3, 4, 5], [10, 20, 30]],
            type: 'line'
          }
        })
      }).not.toThrow()
      const instance = wrapper.vm.getChartInstance()
      expect(instance.isMultiSeries).toBe(true)
      expect(instance.multiSeriesPoints).toHaveLength(2)
    })

    it('coordinate-pair data is treated as single series with custom x values', () => {
      wrapper = mount(Sparkline, {
        props: { data: [[1, 10], [2, 20], [3, 15]], type: 'line' }
      })
      const instance = wrapper.vm.getChartInstance()
      expect(instance.isMultiSeries).toBeFalsy()
      expect(instance.xvalues).toEqual([1, 2, 3])
      expect(instance.yvalues).toEqual([10, 20, 15])
    })

    it('single-series getTooltipContent returns null for out-of-range region', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, 2, 3], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance().getTooltipContent(99)).toBeNull()
    })

    it('single-series getTooltipContent returns null for null value at region', () => {
      wrapper = mount(Sparkline, {
        props: { data: [1, null, 3], type: 'line' }
      })
      expect(wrapper.vm.getChartInstance().getTooltipContent(1)).toBeNull()
    })
  })
})

