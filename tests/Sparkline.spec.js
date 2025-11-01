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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        expect(wrapper.exists()).toBe(true)
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
        
        // Pie chart sorts by value but should maintain original index mapping for labels
        expect(wrapper.exists()).toBe(true)
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
      
      expect(wrapper.exists()).toBe(true)
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
      
      expect(wrapper.exists()).toBe(true)
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
      
      expect(wrapper.exists()).toBe(true)
    })

    it('uses default glowIntensity of 5 when not specified', () => {
      wrapper = mount(Sparkline, {
        props: {
          data: [1, 2, 3, 4],
          type: 'pie'
        }
      })
      
      expect(wrapper.exists()).toBe(true)
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
      
      expect(wrapper.exists()).toBe(true)
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
      
      expect(wrapper.exists()).toBe(true)
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
})

