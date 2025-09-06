"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name: string
  isGuest?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  loginAsGuest: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check for existing session - simplified logic
    const checkExistingSession = () => {
      try {
        // Check for guest user first (sessionStorage)
        const guestUser = sessionStorage.getItem("trip_planner_guest_user")
        if (guestUser) {
          const parsedGuestUser = JSON.parse(guestUser)
          console.log("Found guest user:", parsedGuestUser)
          setUser(parsedGuestUser)
          setLoading(false)
          return
        }

        // Check for regular user (localStorage)
        const regularUser = localStorage.getItem("trip_planner_user")
        if (regularUser) {
          const parsedRegularUser = JSON.parse(regularUser)
          console.log("Found regular user:", parsedRegularUser)
          setUser(parsedRegularUser)
          setLoading(false)
          return
        }

        // No user found
        console.log("No existing user session found")
        setUser(null)
        setLoading(false)
      } catch (error) {
        console.error("Error checking existing session:", error)
        // Clear corrupted data
        localStorage.removeItem("trip_planner_user")
        sessionStorage.removeItem("trip_planner_guest_user")
        setUser(null)
        setLoading(false)
      }
    }

    checkExistingSession()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Invalid credentials")
      }

      const userData = await response.json()

      setUser(userData.user)
      localStorage.setItem("trip_planner_user", JSON.stringify(userData.user))
      localStorage.setItem("trip_planner_token", userData.token)
      sessionStorage.removeItem("trip_planner_guest_user") // Clear any guest session

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to your account.",
      })

      console.log("Login successful, user set:", userData.user)
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Signup failed")
      }

      const userData = await response.json()

      setUser(userData.user)
      localStorage.setItem("trip_planner_user", JSON.stringify(userData.user))
      localStorage.setItem("trip_planner_token", userData.token)
      sessionStorage.removeItem("trip_planner_guest_user") // Clear any guest session

      toast({
        title: "Account created!",
        description: "Welcome to AI Trip Planner.",
      })

      console.log("Signup successful, user set:", userData.user)
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginAsGuest = () => {
    const guestUser: User = {
      id: "guest_" + Date.now(),
      email: "guest@example.com",
      name: "Guest User",
      isGuest: true,
    }

    setUser(guestUser)
    sessionStorage.setItem("trip_planner_guest_user", JSON.stringify(guestUser))
    localStorage.removeItem("trip_planner_user") // Clear any regular user session
    localStorage.removeItem("trip_planner_token") // Clear any token

    toast({
      title: "Welcome!",
      description: "You are now using AI Trip Planner as a guest.",
    })

    console.log("Guest login successful, user set:", guestUser)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("trip_planner_user")
    localStorage.removeItem("trip_planner_token")
    sessionStorage.removeItem("trip_planner_guest_user")

    // Clear all user-specific data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("trip_planner_sessions_")) {
        localStorage.removeItem(key)
      }
    })

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })

    console.log("User logged out")

    // Force redirect to auth page
    window.location.href = "/auth"
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
