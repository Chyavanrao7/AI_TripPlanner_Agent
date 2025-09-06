"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChat } from "@/contexts/chat-context"
import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Plus, Search, MessageSquare, Trash2, Calendar, MapPin, Clock, Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export function TripHistorySidebar() {
  const [searchQuery, setSearchQuery] = useState("")
  const { sessions, currentSession, createNewSession, selectSession, deleteSession, searchSessions } = useChat()

  const filteredSessions = searchQuery ? searchSessions(searchQuery) : sessions

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    deleteSession(sessionId)
  }

  const recentSessions = filteredSessions.slice(0, 3)
  const olderSessions = filteredSessions.slice(3)

  return (
    <>
      <SidebarHeader className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <Button
          onClick={createNewSession}
          className={cn(
            "w-full btn-primary h-10 sm:h-11 text-sm sm:text-base",
            "shadow-lg hover:shadow-xl transition-all duration-200",
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Trip Plan
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 h-9 sm:h-10 text-sm",
              "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
              "focus:border-blue-500 dark:focus:border-blue-400 transition-colors",
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {filteredSessions.length === 0 ? (
          <div className="p-4 sm:p-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {searchQuery ? "No trips found" : "No trip plans yet"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {searchQuery ? "Try a different search term" : "Start planning your first adventure!"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Clock className="h-3 w-3 mr-1" />
                  Recent
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <ScrollArea className="max-h-[300px] custom-scrollbar">
                    <SidebarMenu className="space-y-1">
                      {recentSessions.map((session) => (
                        <SidebarMenuItem key={session.id}>
                          <div className="relative group">
                            <SidebarMenuButton
                              onClick={() => selectSession(session.id)}
                              isActive={currentSession?.id === session.id}
                              className={cn(
                                "w-full justify-start p-3 h-auto transition-all duration-200",
                                "hover:bg-gray-100 dark:hover:bg-gray-800",
                                currentSession?.id === session.id &&
                                  "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500",
                              )}
                            >
                              <div className="flex items-start justify-between w-full min-w-0">
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    <h3 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                                      {session.title}
                                    </h3>
                                    {session.messages.length > 5 && (
                                      <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                            </SidebarMenuButton>
                            {/* Delete button outside of SidebarMenuButton */}
                            <div
                              className={cn(
                                "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity",
                                "z-10",
                              )}
                            >
                              <button
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className={cn(
                                  "h-6 w-6 p-0 rounded-md flex items-center justify-center",
                                  "hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
                                  "transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                )}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </ScrollArea>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Older Sessions */}
            {olderSessions.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Earlier
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <ScrollArea className="max-h-[400px] custom-scrollbar">
                    <SidebarMenu className="space-y-1">
                      {olderSessions.map((session) => (
                        <SidebarMenuItem key={session.id}>
                          <div className="relative group">
                            <SidebarMenuButton
                              onClick={() => selectSession(session.id)}
                              isActive={currentSession?.id === session.id}
                              className={cn(
                                "w-full justify-start p-3 h-auto transition-all duration-200",
                                "hover:bg-gray-100 dark:hover:bg-gray-800",
                                currentSession?.id === session.id &&
                                  "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500",
                              )}
                            >
                              <div className="flex items-start justify-between w-full min-w-0">
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                    <h3 className="font-medium text-sm truncate text-gray-900 dark:text-white">
                                      {session.title}
                                    </h3>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDistanceToNow(session.updatedAt, { addSuffix: true })}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                            </SidebarMenuButton>
                            {/* Delete button outside of SidebarMenuButton */}
                            <div
                              className={cn(
                                "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity",
                                "z-10",
                              )}
                            >
                              <button
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className={cn(
                                  "h-6 w-6 p-0 rounded-md flex items-center justify-center",
                                  "hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20",
                                  "transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                                )}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </ScrollArea>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>
        )}
      </SidebarContent>
    </>
  )
}
