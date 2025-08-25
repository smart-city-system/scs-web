/**
 * Tests for HTTP interceptor functionality
 * 
 * These tests verify that the token interceptor works correctly
 */

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

// Mock fetch for testing
const mockFetch = jest.fn()

// Setup mocks
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
  global.fetch = mockFetch
})

beforeEach(() => {
  localStorageMock.clear()
  mockFetch.mockClear()
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: 'test response' })
  })
})

describe('HTTP Interceptor', () => {
  test('should include Authorization header when token exists', async () => {
    // Setup: Store a token in localStorage
    localStorageMock.setItem('sessionToken', 'test-token-123')
    
    // Import http after setting up mocks
    const http = require('@/lib/http').default
    
    // Make a request
    await http.get('/test-endpoint')
    
    // Verify fetch was called with Authorization header
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123'
        })
      })
    )
  })

  test('should not include Authorization header when no token exists', async () => {
    // Ensure no token in localStorage
    localStorageMock.removeItem('sessionToken')
    
    const http = require('@/lib/http').default
    
    // Make a request
    await http.get('/test-endpoint')
    
    // Verify fetch was called without Authorization header
    const fetchCall = mockFetch.mock.calls[0]
    const headers = fetchCall[1].headers
    expect(headers).not.toHaveProperty('Authorization')
  })

  test('should skip Authorization header when skipAuth is true', async () => {
    // Setup: Store a token in localStorage
    localStorageMock.setItem('sessionToken', 'test-token-123')
    
    const http = require('@/lib/http').default
    
    // Make a request with skipAuth: true
    await http.get('/test-endpoint', { skipAuth: true })
    
    // Verify fetch was called without Authorization header
    const fetchCall = mockFetch.mock.calls[0]
    const headers = fetchCall[1].headers
    expect(headers).not.toHaveProperty('Authorization')
  })

  test('should preserve custom headers while adding Authorization', async () => {
    // Setup: Store a token in localStorage
    localStorageMock.setItem('sessionToken', 'test-token-123')
    
    const http = require('@/lib/http').default
    
    // Make a request with custom headers
    await http.post('/test-endpoint', { data: 'test' }, {
      headers: {
        'Custom-Header': 'custom-value',
        'Another-Header': 'another-value'
      }
    })
    
    // Verify fetch was called with both custom and Authorization headers
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token-123',
          'Custom-Header': 'custom-value',
          'Another-Header': 'another-value',
          'Content-Type': 'application/json'
        })
      })
    )
  })
})

/**
 * To run these tests:
 * 
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @types/jest
 * 
 * 2. Add to package.json scripts:
 *    "test": "jest"
 * 
 * 3. Run tests:
 *    npm test
 */
