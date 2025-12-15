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
    console.log('Logging in user:', credentials.email)
    const encodedEmail = encodeURIComponent(credentials.email)
    const url = `${API_BASE_URL}/fetchUserByEmail/${encodedEmail}`
    console.log('Login URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Login response status:', response.status, response.statusText)

    if (!response.ok) {
      if (response.status === 404) {
        console.error('User not found with email:', credentials.email)
        throw new Error('No account found with this email address')
      }
      const errorText = await response.text()
      console.error('Login error response:', errorText)
      throw new Error('Invalid email or password')
    }

    const user: BackendUser = await response.json()
    console.log('User fetched from backend:', { 
      id: user.id, 
      email: user.email,
      hasPassword: !!user.password,
      passwordLength: user.password?.length 
    })

    // Validate user ID
    if (!user.id || typeof user.id !== 'number') {
      console.error('Invalid user ID from backend:', user.id, typeof user.id)
      throw new Error('Invalid user data received from server')
    }
    
    // Validate user ID is reasonable (not a timestamp)
    if (user.id > 1000000) {
      console.error('User ID looks like a timestamp:', user.id)
      throw new Error('Invalid user ID format received from server')
    }

    // Verify password (client-side check - in production, backend should handle this)
    console.log('Comparing passwords:', {
      provided: credentials.password,
      stored: user.password,
      match: user.password === credentials.password
    })
    
    if (user.password !== credentials.password) {
      console.error('Password mismatch for user:', user.email)
      throw new Error('Invalid email or password')
    }

    // Generate a simple token (in production, backend should provide JWT)
    const token = `token-${user.id}-${Date.now()}`

    // Extract profile info if available
    const firstName = user.profile?.firstName || ''
    const lastName = user.profile?.lastName || ''

    console.log('Login successful, returning user ID:', user.id)
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
    console.log('Calling /addUser with:', { email: userData.email, password: '***' })
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

    console.log('Registration response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Registration error:', response.status, errorText)
      if (response.status === 400) {
        throw new Error('Email already registered')
      }
      throw new Error(`Registration failed: ${response.status} ${errorText}`)
    }

    const user: BackendUser = await response.json()
    console.log('User registered successfully:', user)
    if (!user.id || typeof user.id !== 'number') {
      console.error('Invalid user ID type:', typeof user.id, user.id)
      throw new Error('Invalid user ID received from server')
    }
    
    // Validate user ID is reasonable (not a timestamp)
    if (user.id > 1000000) {
      console.error('User ID looks like a timestamp:', user.id)
      throw new Error('Invalid user ID format received from server')
    }
    
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

// Backend Event model
export interface BackendEvent {
  id: number
  title: string
  description?: string | null
  capacity?: number | null
  date?: string | null
  state?: string | null
  country?: string | null
  city?: string | null
  latitude?: string | null
  longitude?: string | null
  creator?: {
    id: number
    email: string
    profile?: BackendProfile | null
  } | null
}

// Backend Interest model
export interface BackendInterest {
  id: number
  name: string
}

// Event creation request
export interface CreateEventRequest {
  title: string
  description?: string | null
  capacity?: number | null
  date?: string | null
  state?: string | null
  country?: string | null
  city?: string | null
  latitude?: string | null
  longitude?: string | null
  creatorId?: number | null
}

// Join event request
export interface JoinEventRequest {
  userId: number
  eventId: number
  rsvpStatus: boolean
}

// Event API functions
export const eventApi = {
  // Create a new event
  createEvent: async (eventData: CreateEventRequest): Promise<BackendEvent> => {
    const response = await fetch(`${API_BASE_URL}/saveEvent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
    return handleResponse<BackendEvent>(response)
  },

  // Get event by ID
  getEventById: async (eventId: number): Promise<BackendEvent> => {
    const response = await fetch(`${API_BASE_URL}/getEventById/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<BackendEvent>(response)
  },

  // Get all events
  getAllEvents: async (): Promise<BackendEvent[]> => {
    const response = await fetch(`${API_BASE_URL}/getAllEvents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<BackendEvent[]>(response)
  },

  // Get events by state
  getEventsByState: async (state: string): Promise<BackendEvent[]> => {
    const response = await fetch(`${API_BASE_URL}/getEventByState/${encodeURIComponent(state)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.status === 404) {
      return []
    }
    return handleResponse<BackendEvent[]>(response)
  },

  // Get events by state and city
  getEventsByStateCity: async (state: string, city: string): Promise<BackendEvent[]> => {
    const response = await fetch(
      `${API_BASE_URL}/getEventByStateCity/${encodeURIComponent(state)}/${encodeURIComponent(city)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    if (response.status === 404) {
      return []
    }
    return handleResponse<BackendEvent[]>(response)
  },

  // Update event
  updateEvent: async (eventId: number, eventData: Partial<CreateEventRequest>): Promise<BackendEvent> => {
    const response = await fetch(`${API_BASE_URL}/updateEvent/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
    return handleResponse<BackendEvent>(response)
  },

  // Delete event
  deleteEvent: async (eventId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/deleteEvent/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error('Failed to delete event')
    }
  },

  // Join an event
  joinEvent: async (userId: number, eventId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/JoinUserEvent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        eventId,
        rsvpStatus: true,
      }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Join event error:', response.status, errorText)
      if (response.status === 400) {
        // Try to parse error message
        try {
          const error = JSON.parse(errorText)
          throw new Error(error.message || 'Event is at full capacity or you already joined')
        } catch {
          throw new Error('Event is at full capacity or you already joined this event')
        }
      }
      throw new Error(`Failed to join event: ${response.status} ${errorText}`)
    }
  },

  // Get attendees count for an event
  getAttendeesCount: async (eventId: number): Promise<number> => {
    const response = await fetch(`${API_BASE_URL}/getAttendees/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<number>(response)
  },

  // Get all users attending an event
  getEventAttendees: async (eventId: number): Promise<BackendProfile[]> => {
    const response = await fetch(`${API_BASE_URL}/getAllUsersAttending/${eventId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.status === 404) {
      return [] // Return empty array if no attendees found
    }
    return handleResponse<BackendProfile[]>(response)
  },
}

// Interest API functions
export const interestApi = {
  // Get all available interests
  getAllInterests: async (): Promise<BackendInterest[]> => {
    const response = await fetch(`${API_BASE_URL}/getAllInterests`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<BackendInterest[]>(response)
  },

  // Add interests to a user
  addInterestsToUser: async (userId: number, interestNames: string[]): Promise<BackendUser> => {
    const response = await fetch(`${API_BASE_URL}/addInterestsToUser/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interestNames),
    })
    return handleResponse<BackendUser>(response)
  },
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

