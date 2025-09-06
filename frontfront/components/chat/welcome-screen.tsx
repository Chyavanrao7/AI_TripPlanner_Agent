"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useChat } from "@/contexts/chat-context"
import { useAuth } from "@/contexts/auth-context"
import { MapPin, Calendar, Plane, Mountain, Palmtree, Building, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Reduced number of sample queries
const sampleQueries = [
  {
    icon: Plane,
    title: "Weekend Getaway",
    query: "Plan a 3-day weekend trip to Paris with a budget of $1500",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Mountain,
    title: "Adventure Trip",
    query: "I want to go hiking and camping in the Rocky Mountains for a week",
    color: "from-green-500 to-green-600",
  },
  {
    icon: Palmtree,
    title: "Beach Vacation",
    query: "Plan a relaxing 10-day beach vacation in the Maldives",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Building,
    title: "City Explorer",
    query: "Show me the best attractions and restaurants in New York City for 5 days",
    color: "from-purple-500 to-purple-600",
  },
]

// Reduced number of features
const features = [
  {
    icon: MapPin,
    title: "Smart Destinations",
    description: "Get personalized destination recommendations based on your preferences",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Calendar,
    title: "Custom Itineraries",
    description: "Detailed day-by-day plans with activities and restaurants",
    color: "text-green-600 dark:text-green-400",
  },
]

export function WelcomeScreen() {
  const { sendMessage } = useChat()
  const { user } = useAuth()

  const handleSampleQuery = (query: string) => {
    sendMessage(query)
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar relative">
      <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-6 lg:p-8 relative">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 w-full relative z-10">
          {/* Welcome Header - More compact */}
          <div className="text-center space-y-3 sm:space-y-4 fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative p-3 rounded-full bg-gradient-to-r from-blue-600 to-green-600 hover-lift backdrop-blur-sm">
                <Plane className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                Welcome{user?.isGuest ? "" : `, ${user?.name.split(" ")[0]}`}!
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 rounded-lg p-3">
                I'm your AI travel assistant. Tell me where you'd like to go, and I'll help you plan the
                <span className="heading-gradient font-semibold"> perfect trip </span>
                with personalized recommendations.
              </p>
            </div>
          </div>

          {/* Features Grid - More compact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center space-x-3 p-3 sm:p-4",
                  "rounded-xl glass border border-gray-200/50 dark:border-gray-700/50",
                  "hover-lift transition-all duration-300",
                  "fade-in backdrop-blur-md bg-white/30 dark:bg-gray-900/30",
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn("p-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm")}>
                  <feature.icon className={cn("h-5 w-5 sm:h-6 sm:w-6", feature.color)} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sample Queries - More compact */}
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                Get Started with These Ideas
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {sampleQueries.map((sample, index) => (
                <Card
                  key={index}
                  className={cn(
                    "cursor-pointer group transition-all duration-300 hover-lift",
                    "border border-gray-200/50 dark:border-gray-700/50 glass",
                    "hover:shadow-xl hover:scale-105 hover:border-gray-300 dark:hover:border-gray-600",
                    "fade-in backdrop-blur-md bg-white/40 dark:bg-gray-900/40",
                  )}
                  style={{ animationDelay: `${(index + 2) * 100}ms` }}
                  onClick={() => handleSampleQuery(sample.query)}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg bg-gradient-to-r",
                          sample.color,
                          "group-hover:scale-110 transition-transform duration-200",
                        )}
                      >
                        <sample.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{sample.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-1">
                          {sample.query}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
