"use client"

import type { Message } from "@/contexts/chat-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Bot, Copy, Share, ThumbsUp, ThumbsDown, Map } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
  onViewTrip: (messageContent: string) => void // New prop to pass content up
}

export function MessageBubble({ message, onViewTrip }: MessageBubbleProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const isUser = message.role === "user"

  // Check if message contains trip planning content (heuristic)
  const containsTripPlan =
    !isUser &&
    (message.content.toLowerCase().includes("itinerary") ||
      message.content.toLowerCase().includes("day 1") ||
      message.content.toLowerCase().includes("schedule") ||
      message.content.toLowerCase().includes("trip plan") ||
      (message.content.includes("## Day") && message.content.includes("**Start Date:**"))) // Added check for new format

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Trip Plan",
          text: message.content,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      handleCopy()
    }
  }

  const handleViewTripClick = () => {
    onViewTrip(message.content) // Pass the message content to the parent
  }

  return (
    <>
      <div className={cn("flex gap-3 sm:gap-4 group", isUser ? "justify-end" : "justify-start")}>
        {!isUser && (
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-1 flex-shrink-0 hover-lift">
            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
            </AvatarFallback>
          </Avatar>
        )}

        <div className={cn("max-w-[85%] sm:max-w-[80%] lg:max-w-[70%]", isUser ? "order-first" : "")}>
          <Card
            className={cn(
              "transition-all duration-200 hover-lift",
              isUser
                ? "bg-gradient-to-r from-blue-600 to-green-600 text-white border-0 shadow-lg"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg",
            )}
          >
            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div
                className={cn(
                  "prose prose-sm sm:prose-base max-w-none",
                  isUser ? "prose-invert" : "dark:prose-invert prose-gray dark:prose-gray",
                )}
              >
                {isUser ? (
                  <p className="text-white m-0 leading-relaxed">{message.content}</p>
                ) : (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-lg sm:text-xl font-bold mb-3 text-gray-900 dark:text-white">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base sm:text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm sm:text-base font-medium mb-2 text-gray-700 dark:text-gray-300">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-3 space-y-1 sm:space-y-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-3 space-y-1 sm:space-y-2">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                      ),
                      em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-400">{children}</em>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic text-gray-600 dark:text-gray-400 my-3 bg-blue-50 dark:bg-blue-950/20 py-2 rounded-r">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>

              <div
                className={cn(
                  "flex items-center justify-between mt-3 pt-3",
                  "border-t border-gray-200/50 dark:border-gray-600/50",
                  isUser && "border-white/20",
                )}
              >
                <span
                  className={cn("text-xs sm:text-sm", isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400")}
                >
                  {format(message.timestamp, "HH:mm")}
                </span>

                {!isUser && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {containsTripPlan && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleViewTripClick} // Call the new handler
                        className="h-7 px-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs"
                      >
                        <Map className="h-3 w-3 mr-1" />
                        View Trip
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleShare}
                      className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Share className="h-3 w-3" />
                    </Button>
                    <div className="hidden sm:flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {isUser && (
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mt-1 flex-shrink-0 hover-lift">
            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </>
  )
}
