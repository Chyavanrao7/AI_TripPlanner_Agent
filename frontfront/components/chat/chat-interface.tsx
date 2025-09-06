"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, Sidebar, SidebarContent, SidebarInset } from "@/components/ui/sidebar"
import { TripHistorySidebar } from "./trip-history-sidebar"
import { ChatArea } from "./chat-area"
import { ChatHeader } from "./chat-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  return (
    <div className="chat-container bg-gradient-to-br from-blue-50/30 via-white to-green-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex h-full w-full">
          <Sidebar
            className={cn(
              "border-r border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm",
              "bg-white/80 dark:bg-gray-900/80",
              "w-[280px] max-w-[280px]",
            )}
            collapsible="offcanvas"
          >
            <SidebarContent className="bg-transparent">
              <TripHistorySidebar />
            </SidebarContent>
          </Sidebar>

          <SidebarInset className="flex-1 flex flex-col min-w-0 w-full relative">
            {/* Background pattern */}
            <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10">
              <div className="absolute top-0 left-0 w-full h-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  className="text-blue-600 dark:text-blue-400"
                >
                  <pattern
                    id="pattern-circles"
                    x="0"
                    y="0"
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                    patternContentUnits="userSpaceOnUse"
                  >
                    <circle id="pattern-circle" cx="10" cy="10" r="1.6257413380501518" fill="currentColor"></circle>
                  </pattern>
                  <rect id="rect" x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
                </svg>
              </div>
            </div>

            <ChatHeader />
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
              <ChatArea />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
