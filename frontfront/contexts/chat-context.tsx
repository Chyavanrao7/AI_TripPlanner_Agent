"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { useToast } from "@/hooks/use-toast"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isTyping?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface ChatContextType {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  loading: boolean
  isTyping: boolean
  createNewSession: () => void
  selectSession: (sessionId: string) => void
  sendMessage: (content: string) => Promise<void>
  deleteSession: (sessionId: string) => void
  clearCurrentChat: () => void
  searchSessions: (query: string) => ChatSession[]
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = () => {
    const savedSessions = localStorage.getItem(`trip_planner_sessions_${user?.id}`)
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }))
        setSessions(parsedSessions)

        // Set the most recent session as current if none is selected
        if (parsedSessions.length > 0 && !currentSession) {
          setCurrentSession(parsedSessions[0])
        }
      } catch (error) {
        console.error("Error loading sessions:", error)
      }
    }
  }

  const saveSessions = (updatedSessions: ChatSession[]) => {
    if (user) {
      localStorage.setItem(`trip_planner_sessions_${user.id}`, JSON.stringify(updatedSessions))
    }
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: "New Trip Plan",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    setCurrentSession(newSession)
    saveSessions(updatedSessions)
  }

  const selectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      setCurrentSession(session)
    }
  }

  const generateSessionTitle = (firstMessage: string): string => {
    // Extract destination or key terms from the first message
    const words = firstMessage.toLowerCase().split(" ")
    const destinations = words.filter(
      (word) => word.length > 3 && !["trip", "plan", "travel", "visit", "going", "want", "like", "help"].includes(word),
    )

    if (destinations.length > 0) {
      return `Trip to ${destinations[0].charAt(0).toUpperCase() + destinations[0].slice(1)}`
    }

    return `Trip Plan - ${new Date().toLocaleDateString()}`
  }

  const sendMessage = async (content: string) => {
    if (!currentSession) {
      createNewSession()
      return
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date(),
    }

    // Update current session with user message
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: new Date(),
      title: currentSession.messages.length === 0 ? generateSessionTitle(content) : currentSession.title,
    }

    setCurrentSession(updatedSession)
    setIsTyping(true)
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("trip_planner_token")}`,
        },
        body: JSON.stringify({
          message: content,
          session_id: currentSession.id,
          history: currentSession.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from AI")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, assistantMessage],
        updatedAt: new Date(),
      }

      setCurrentSession(finalSession)

      // Update sessions list
      const updatedSessions = sessions.map((s) => (s.id === currentSession.id ? finalSession : s))
      setSessions(updatedSessions)
      saveSessions(updatedSessions)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })

      // Remove the user message if API call failed
      setCurrentSession(currentSession)
    } finally {
      setIsTyping(false)
      setLoading(false)
    }
  }

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionId)
    setSessions(updatedSessions)
    saveSessions(updatedSessions)

    if (currentSession?.id === sessionId) {
      setCurrentSession(updatedSessions.length > 0 ? updatedSessions[0] : null)
    }

    toast({
      title: "Session deleted",
      description: "Trip planning session has been removed.",
    })
  }

  const clearCurrentChat = () => {
    if (currentSession) {
      const clearedSession = {
        ...currentSession,
        messages: [],
        title: "New Trip Plan",
        updatedAt: new Date(),
      }

      setCurrentSession(clearedSession)

      const updatedSessions = sessions.map((s) => (s.id === currentSession.id ? clearedSession : s))
      setSessions(updatedSessions)
      saveSessions(updatedSessions)
    }
  }

  const searchSessions = (query: string): ChatSession[] => {
    if (!query.trim()) return sessions

    return sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(query.toLowerCase()) ||
        session.messages.some((msg) => msg.content.toLowerCase().includes(query.toLowerCase())),
    )
  }

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSession,
        loading,
        isTyping,
        createNewSession,
        selectSession,
        sendMessage,
        deleteSession,
        clearCurrentChat,
        searchSessions,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
