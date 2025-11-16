// Temporary local storage service for account and profile data
// This will be replaced with backend API calls when PostgreSQL is integrated

export interface LocalUser {
  id: number
  email: string
  firstName: string
  lastName: string
  password: string // In production, this would never be stored client-side
  createdAt: string
}

export interface LocalUserProfile {
  userId: number
  dateOfBirth: string
  age: number
  languages: string[]
  interests: string[]
  travelStyle?: string
  preferredActivityTypes: string[]
  bio?: string
  updatedAt: string
}

const STORAGE_KEYS = {
  USERS: 'urbane_users',
  PROFILES: 'urbane_profiles',
  CURRENT_USER: 'urbane_current_user',
  AUTH_TOKEN: 'authToken',
} as const

// Initialize storage if it doesn't exist
const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([]))
  }
}

// User account management
export const localAuth = {
  // Register a new user
  register: (userData: {
    firstName: string
    lastName: string
    email: string
    password: string
  }): LocalUser => {
    initializeStorage()
    const users = getUsers()
    
    // Check if email already exists
    if (users.find((u) => u.email === userData.email)) {
      throw new Error('Email already registered')
    }

    const newUser: LocalUser = {
      id: Date.now(), // Simple ID generation
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password, // In production, this would be hashed
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
    
    return newUser
  },

  // Login user
  login: (email: string, password: string): LocalUser => {
    initializeStorage()
    const users = getUsers()
    const user = users.find(
      (u) => u.email === email && u.password === password
    )

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Set current user and token
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, `local-token-${user.id}`)

    return user
  },

  // Get current user
  getCurrentUser: (): LocalUser | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    return userStr ? JSON.parse(userStr) : null
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  },

  // Get all users (for debugging)
  getAllUsers: (): LocalUser[] => {
    initializeStorage()
    return getUsers()
  },
}

// User profile management
export const localProfile = {
  // Save or update user profile
  saveProfile: (profileData: Omit<LocalUserProfile, 'updatedAt'>): LocalUserProfile => {
    initializeStorage()
    const profiles = getProfiles()
    
    const existingIndex = profiles.findIndex((p) => p.userId === profileData.userId)
    
    const profile: LocalUserProfile = {
      ...profileData,
      updatedAt: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile
    } else {
      profiles.push(profile)
    }

    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles))
    return profile
  },

  // Get profile by user ID
  getProfile: (userId: number): LocalUserProfile | null => {
    initializeStorage()
    const profiles = getProfiles()
    return profiles.find((p) => p.userId === userId) || null
  },

  // Get current user's profile
  getCurrentProfile: (): LocalUserProfile | null => {
    const user = localAuth.getCurrentUser()
    if (!user) return null
    return localProfile.getProfile(user.id)
  },

  // Get all profiles (for debugging)
  getAllProfiles: (): LocalUserProfile[] => {
    initializeStorage()
    return getProfiles()
  },
}

// Helper functions
function getUsers(): LocalUser[] {
  const usersStr = localStorage.getItem(STORAGE_KEYS.USERS)
  return usersStr ? JSON.parse(usersStr) : []
}

function getProfiles(): LocalUserProfile[] {
  const profilesStr = localStorage.getItem(STORAGE_KEYS.PROFILES)
  return profilesStr ? JSON.parse(profilesStr) : []
}

// Debug utility - log all stored data
export const debugStorage = () => {
  console.log('=== Urbane Local Storage Debug ===')
  console.log('Users:', localAuth.getAllUsers())
  console.log('Profiles:', localProfile.getAllProfiles())
  console.log('Current User:', localAuth.getCurrentUser())
  console.log('Current Profile:', localProfile.getCurrentProfile())
  console.log('================================')
}

