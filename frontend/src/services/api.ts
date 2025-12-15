// API service for SpringBoot backend integration
// Base URL can be configured via environment variables

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// Backend User model
export interface BackendUser {
  id: number
  email: string
  password: string
  profile?: BackendProfile | null
}

// Backend Profile model
export interface BackendProfile {
  id: number // same as user_id
  firstName?: string | null
  lastName?: string | null
  age?: number | null
  photo?: string | null
  location?: BackendLocation | null
}

// Backend Location model
export interface BackendLocation {
  id: number
  country?: string | null
  city?: string | null
  state?: string | null
  latitude?: string | null
  longitude?: string | null
}

// Frontend types for API requests
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    firstName?: string
    lastName?: string
  }
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  id: number
  email: string
}

// Profile creation/update request matching backend Profile model
export interface ProfileRequest {
  firstName?: string | null
  lastName?: string | null
  age?: number | null
  photo?: string | null
  location?: BackendLocation | null
}

// Extended profile data stored in localStorage (not yet in backend)
export interface ExtendedProfileData {
  dateOfBirth: string
  languages: string[]
  interests: string[]
  travelStyle?: string
  preferredActivityTypes?: string[]
  bio?: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`,
    }))
    
    // Log error for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        error,
      })
    }
    
    throw new Error(error.message || 'An error occurred')
  }
  
  const data = await response.json()
  
  // Log successful responses in development
  if (import.meta.env.DEV) {
    console.log('API Success:', {
      url: response.url,
      method: response.url.includes('fetch') ? 'GET' : 'POST',
      data,
    })
  }
  
  return data
}

// Auth API functions
export const authApi = {
  // Login: fetch user by email, then verify password client-side
  // Note: In production, this should be done server-side with proper authentication
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/fetchUserByEmail/${encodeURIComponent(credentials.email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Invalid email or password')
    }

    const user: BackendUser = await response.json()

    // Verify password (client-side check - in production, backend should handle this)
    if (user.password !== credentials.password) {
      throw new Error('Invalid email or password')
    }

    // Generate a simple token (in production, backend should provide JWT)
    const token = `token-${user.id}-${Date.now()}`

    // Extract profile info if available
    const firstName = user.profile?.firstName || ''
    const lastName = user.profile?.lastName || ''

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
      },
    }
  },

  // Register: create new user with email and password
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await fetch(`${API_BASE_URL}/addUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
      }),
    })

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Email already registered')
      }
      throw new Error('Registration failed')
    }

    const user: BackendUser = await response.json()
    return {
      id: user.id,
      email: user.email,
    }
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },
}

// Profile API functions
export const profileApi = {
  // Save profile for a user (creates new profile)
  saveProfile: async (
    userId: number,
    profileData: ProfileRequest
  ): Promise<BackendProfile> => {
    const response = await fetch(`${API_BASE_URL}/saveProfile/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    })
    return handleResponse<BackendProfile>(response)
  },

  // Update existing profile
  updateProfile: async (
    userId: number,
    profileData: ProfileRequest
  ): Promise<BackendProfile> => {
    const response = await fetch(`${API_BASE_URL}/updateProfile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    })
    return handleResponse<BackendProfile>(response)
  },

  // Fetch profile by user ID
  fetchProfile: async (userId: number): Promise<BackendProfile> => {
    const response = await fetch(`${API_BASE_URL}/fetchProfile/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<BackendProfile>(response)
  },
}

// Helper to get auth token for authenticated requests (for future use)
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Generic API request helper for future endpoints
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })
  return handleResponse<T>(response)
}

