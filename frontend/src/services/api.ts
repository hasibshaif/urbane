// API service for SpringBoot backend integration
// Base URL can be configured via environment variables

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Types matching expected SpringBoot DTOs
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface RegisterResponse {
  id: number
  email: string
  firstName: string
  lastName: string
  message?: string
}

// Onboarding types - structured for PostgreSQL integration
export interface OnboardingRequest {
  userId: number
  dateOfBirth: string // ISO date string (YYYY-MM-DD)
  languages: string[] // Array of language codes or names
  interests: string[] // Array of interest tags
  travelStyle?: string // Optional: solo, group, mixed, etc.
  preferredActivityTypes?: string[] // Optional: outdoor, cultural, nightlife, etc.
  bio?: string // Optional bio/description
}

export interface OnboardingResponse {
  id: number
  userId: number
  age: number // Calculated from dateOfBirth
  languages: string[]
  interests: string[]
  travelStyle?: string
  preferredActivityTypes?: string[]
  bio?: string
  message?: string
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
    throw new Error(error.message || 'An error occurred')
  }
  return response.json()
}

// Auth API functions
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    return handleResponse<LoginResponse>(response)
  },

  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    return handleResponse<RegisterResponse>(response)
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('authToken')
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },
}

// Onboarding API functions
export const onboardingApi = {
  completeOnboarding: async (
    onboardingData: OnboardingRequest
  ): Promise<OnboardingResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/onboarding`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(onboardingData),
    })
    return handleResponse<OnboardingResponse>(response)
  },

  updateProfile: async (
    userId: number,
    profileData: Partial<OnboardingRequest>
  ): Promise<OnboardingResponse> => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    })
    return handleResponse<OnboardingResponse>(response)
  },
}

// Helper to get auth token for authenticated requests
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

