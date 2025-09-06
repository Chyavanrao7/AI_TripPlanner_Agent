"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ChatInterface } from "@/components/chat/chat-interface"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ChatRoutePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isInitialCheckComplete, setIsInitialCheckComplete] = useState(false)

  useEffect(() => {
    // Only run redirect logic after auth context has finished loading
    if (!loading) {
      setIsInitialCheckComplete(true)

      if (!user) {
        console.log("No user found, redirecting to auth...")
        router.replace("/auth")
      }
    }
  }, [user, loading, router])

  // Show loading while auth context is initializing
  if (loading || !isInitialCheckComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading user data...</p>
      </div>
    )
  }

  // Only show chat if user is logged in
  if (user) {
    return <ChatInterface />
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to login...</p>
      </div>
    </div>
  )
}
