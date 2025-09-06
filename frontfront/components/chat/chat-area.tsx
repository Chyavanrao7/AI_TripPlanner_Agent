"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChat } from "@/contexts/chat-context"
import { MessageBubble } from "./message-bubble"
import { MessageInput } from "./message-input"
import { WelcomeScreen } from "./welcome-screen"
import { TypingIndicator } from "./typing-indicator"
import { cn } from "@/lib/utils"

export function ChatArea() {
  const { currentSession, isTyping } = useChat()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [showTripVisualizer, setShowTripVisualizer] = useState(false)
  const [tripContentToVisualize, setTripContentToVisualize] = useState("")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages, isTyping])

  const handleViewTrip = (content: string) => {
    setTripContentToVisualize(content)
    setShowTripVisualizer(true)
  }

  if (!currentSession || currentSession.messages.length === 0) {
    return (
      <div className="flex flex-col h-full relative">
        <div className="flex-1 overflow-hidden">
          <WelcomeScreen />
        </div>
        <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
            <MessageInput />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full custom-scrollbar" ref={scrollAreaRef}>
          <div className="p-3 sm:p-4 lg:p-6 pb-4">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {currentSession.messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn("fade-in", index === currentSession.messages.length - 1 && "message-bubble")}
                >
                  <MessageBubble message={message} onViewTrip={handleViewTrip} />
                </div>
              ))}
              {isTyping && (
                <div className="fade-in">
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <MessageInput />
        </div>
      </div>

      {/* Trip Visualizer Modal */}
      {/*
      <TripVisualizer
        isVisible={showTripVisualizer}
        onClose={() => setShowTripVisualizer(false)}
        messageContent={tripContentToVisualize}
      />
      */}
    </div>
  )
}
