"use client"

import { useState } from "react"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane, MapPin, Compass, Sparkles, Globe } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { loginAsGuest } = useAuth()

  const handleGuestLogin = () => {
    console.log("Guest login clicked")
    loginAsGuest()
    // Don't redirect here - let the auth page handle it
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Hero Section */}
        <div className="space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-center lg:justify-start gap-3 text-blue-600 dark:text-blue-400">
              <div className="relative">
                <Plane className="h-8 w-8 sm:h-10 sm:w-10" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">AI Trip Planner</h1>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Plan Your Perfect
                <span className="block heading-gradient">Journey</span>
              </h2>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Let our AI assistant help you create amazing travel experiences tailored just for you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                icon: MapPin,
                title: "Smart Destinations",
                description: "Discover hidden gems and popular spots",
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                icon: Compass,
                title: "Custom Itineraries",
                description: "Personalized plans for your style",
                color: "text-green-600 dark:text-green-400",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col items-center space-y-2 sm:space-y-3 p-4 sm:p-6",
                  "rounded-xl sm:rounded-2xl glass border border-gray-200 dark:border-gray-700",
                  "hover-lift transition-all duration-300 fade-in",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <feature.icon className={cn("h-6 w-6 sm:h-8 sm:w-8", feature.color)} />
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white text-center">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="hidden lg:block space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-green-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-semibold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>Join 10,000+ happy travelers</span>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="w-full max-w-md mx-auto order-1 lg:order-2">
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <Card
              className={cn(
                "shadow-2xl border-0 glass backdrop-blur-md",
                "bg-white/90 dark:bg-gray-900/90",
                "hover-lift transition-all duration-300",
              )}
            >
              <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {isLogin ? "Sign in to continue planning your trips" : "Join thousands of happy travelers"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6">
                {isLogin ? <LoginForm /> : <SignupForm />}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400 font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full h-11 btn-secondary",
                    "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                    "transition-all duration-200 hover-lift",
                  )}
                  onClick={handleGuestLogin}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Continue as Guest
                </Button>

                <div className="text-center text-sm">
                  {isLogin ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
