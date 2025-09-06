"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useChat } from "@/contexts/chat-context"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function MessageInput() {
  const [message, setMessage] = useState("")
  const [isComposing, setIsComposing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, loading } = useChat()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || loading) return

    const messageToSend = message.trim()
    setMessage("")

    try {
      await sendMessage(messageToSend)
    } catch (error) {
      // Error is handled in the chat context
      setMessage(messageToSend) // Restore message on error
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, 120)
      textarea.style.height = newHeight + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [message])

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "relative flex items-end gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl",
          "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
          "shadow-lg dark:shadow-gray-900/20 transition-all duration-200",
          isFocused && "ring-2 ring-blue-500/20 dark:ring-blue-400/20 border-blue-300 dark:border-blue-600",
          "hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600",
        )}
      >
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask me about your next trip..."
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0 p-0",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              "text-sm sm:text-base leading-relaxed",
              "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600",
            )}
            disabled={loading}
            rows={1}
          />
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || loading}
          className={cn(
            "h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-lg sm:rounded-xl",
            "bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200 hover:scale-105 hover:shadow-lg",
            "focus-ring",
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      </div>

      {/* Quick suggestions - Reduced to 2 */}
      {!message && !loading && (
        <div className="flex flex-wrap gap-2 mt-3">
          {["Plan a weekend trip", "Best restaurants in..."].map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setMessage(suggestion)}
              className={cn(
                "text-xs h-7 px-2",
                "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
                "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
              )}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      )}
    </form>
  )
}
