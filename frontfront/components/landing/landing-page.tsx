"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import dynamic from "next/dynamic"

interface LandingPageProps {
  onContinue: () => void
}

// Dynamically import the GlobeRenderer component with better error handling
const GlobeComponent = dynamic(() => import("./globe-renderer").then((mod) => mod.GlobeRenderer), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-white text-lg">Loading the world...</p>
      </div>
    </div>
  ),
})

export function LandingPage({ onContinue }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Globe container */}
      <GlobeComponent />

      {/* Header with CSS animations instead of framer-motion */}
      <div className="absolute top-0 left-0 right-0 p-6 sm:p-8 text-center z-10 animate-in fade-in slide-in-from-top-4 duration-1000 delay-500">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
          Welcome to AI Trip Planner
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-blue-200 max-w-2xl mx-auto">
          Explore the world and plan your perfect journey with AI assistance
        </p>
      </div>

      {/* Continue button with CSS animations */}
      <div className="absolute bottom-8 right-8 z-10 animate-in fade-in zoom-in-50 duration-500 delay-1000">
        <Button
          onClick={onContinue}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 px-6 py-6 text-lg rounded-xl"
        >
          Continue <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
