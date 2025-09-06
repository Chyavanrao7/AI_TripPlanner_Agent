"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/auth-context" // Import useAuth

export default function RootPage() {
  const router = useRouter()
  const { user, loading } = useAuth() // Get user and loading from AuthContext
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false)

  useEffect(() => {
    // Mark auth check as complete once loading is false
    if (!loading) {
      setIsAuthCheckComplete(true)
    }
  }, [loading])

  const handleContinueFromLanding = () => {
    // After clicking continue, check auth status
    if (user) {
      console.log("User logged in, redirecting to chat.")
      router.replace("/chat")
    } else {
      console.log("No user logged in, redirecting to auth.")
      router.replace("/auth")
    }
  }

  // Show loading spinner while auth context is initializing
  if (loading || !isAuthCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" className="text-white" />
      </div>
    )
  }

  // Always show the landing page first
  return <LandingPage onContinue={handleContinueFromLanding} />
}
