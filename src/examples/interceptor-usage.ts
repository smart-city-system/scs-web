/**
 * Example demonstrating how the HTTP interceptor automatically includes tokens
 * 
 * The interceptor is now active in src/lib/http.ts and will automatically:
 * 1. Check if we're running on the client side (browser)
 * 2. Retrieve the sessionToken from localStorage
 * 3. Add Authorization: Bearer <token> header to all requests
 * 4. Skip token inclusion when skipAuth: true is passed in options
 */

import http from '@/lib/http'

// Example 1: Regular API call - token will be automatically included
export async function fetchUserProfile() {
  try {
    // The interceptor will automatically add: Authorization: Bearer <token>
    const response = await http.get('/user/profile')
    return response.payload
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    throw error
  }
}

// Example 2: API call with custom headers - token still included automatically
export async function updateUserData(userData: any) {
  try {
    // Token is automatically added along with custom headers
    const response = await http.put('/user/profile', userData, {
      headers: {
        'Custom-Header': 'custom-value'
      }
    })
    return response.payload
  } catch (error) {
    console.error('Failed to update user data:', error)
    throw error
  }
}

// Example 3: Skip authentication for public endpoints
export async function fetchPublicData() {
  try {
    // skipAuth: true prevents the interceptor from adding the token
    const response = await http.get('/public/data', {
      skipAuth: true
    })
    return response.payload
  } catch (error) {
    console.error('Failed to fetch public data:', error)
    throw error
  }
}

// Example 4: Login request - should skip auth (already configured in authService)
export async function loginUser(email: string, password: string) {
  try {
    // This will use authService.login which has skipAuth: true
    // No token header will be added since user isn't authenticated yet
    const response = await http.post('/auth/login', {
      email,
      password
    }, {
      skipAuth: true // Explicitly skip auth for login
    })
    
    // After successful login, store the token
    if (response.payload.token) {
      localStorage.setItem('sessionToken', response.payload.token)
    }
    
    return response.payload
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

// Example 5: Logout - clear token from localStorage
export async function logoutUser() {
  try {
    // Send logout request with current token
    await http.post('/auth/logout', {})
    
    // Clear token from localStorage
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('sessionTokenExpiresAt')
    
    // Redirect to login page
    window.location.href = '/sign-in'
  } catch (error) {
    console.error('Logout failed:', error)
    // Clear token anyway on logout failure
    localStorage.removeItem('sessionToken')
    localStorage.removeItem('sessionTokenExpiresAt')
    throw error
  }
}

/**
 * How the interceptor works:
 * 
 * 1. Every HTTP request goes through the request() function in http.ts
 * 2. The interceptor checks if we're on the client side using isClient()
 * 3. If on client and skipAuth is not true, it gets sessionToken from localStorage
 * 4. If token exists, it adds Authorization: Bearer <token> to headers
 * 5. The request proceeds with the token automatically included
 * 
 * Benefits:
 * - No need to manually add Authorization header to every request
 * - Centralized token management
 * - Easy to skip authentication for specific requests
 * - Works seamlessly with existing code
 */
