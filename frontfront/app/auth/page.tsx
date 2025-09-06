"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthPage } from "@/components/auth/auth-page"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AuthRoutePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false)

  useEffect(() => {
    // Only run redirect logic after auth context has finished loading
    if (!loading) {
      setIsInitialCheckComplete(true)

      if (user) {
        console.log("User found, redirecting to chat...")
        router.replace("/chat")
      }
    }
  }, [user, loading, router])

  // Show loading while auth context is initializing
  if (loading || !isInitialCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  // Only show auth page if no user is logged in
  if (!user) {
    return <AuthPage />
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to chat...</p>
      </div>
    </div>
  )
}
