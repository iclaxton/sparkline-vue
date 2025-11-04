// Test setup file
import { vi } from 'vitest'

// Set NODE_ENV to development for tests to enable validation error messages
process.env.NODE_ENV = 'development'

// Mock canvas context for tests
HTMLCanvasElement.prototype.getContext = function(contextType) {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      setTransform: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      canvas: this
    }
  }
  return null
}

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  global.performance = { now: () => Date.now() }
}

// Suppress console warnings during tests unless explicitly testing them
global.console = {
  ...console,
  // Keep error and warn for testing validation
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn()
}
