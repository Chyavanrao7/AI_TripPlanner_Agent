"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Settings, LogOut, Trash2, Moon, Sun, Plane, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ChatHeader() {
  const { user, logout } = useAuth()
  const { clearCurrentChat, currentSession } = useChat()
  const { theme, setTheme } = useTheme()

  const handleClearChat = () => {
    if (currentSession && currentSession.messages.length > 0) {
      clearCurrentChat()
    }
  }

  return (
    <header className="flex-shrink-0 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">AI Trip Planner</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Your intelligent travel companion
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentSession && currentSession.messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className={cn(
                "text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400",
                "border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-600",
                "bg-white/80 dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-950/20",
                "transition-all duration-200 hover-lift",
                "hidden sm:flex",
              )}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "relative h-8 w-8 sm:h-9 sm:w-9 rounded-full",
                  "hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200",
                  "focus-ring",
                )}
              >
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 hover-lift">
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold">
                    {user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn(
                "w-56 sm:w-64 glass border-gray-200 dark:border-gray-700",
                "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md",
              )}
              align="end"
              forceMount
            >
              <div className="flex items-center justify-start gap-3 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="w-[180px] truncate text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                  {user?.isGuest && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      Guest User
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

              {/* Mobile clear chat option */}
              {currentSession && currentSession.messages.length > 0 && (
                <>
                  <DropdownMenuItem
                    onClick={handleClearChat}
                    className="sm:hidden text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Clear Chat</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden bg-gray-200 dark:bg-gray-700" />
                </>
              )}

              <DropdownMenuItem className="focus:bg-gray-100 dark:focus:bg-gray-800">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-gray-100 dark:focus:bg-gray-800">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="focus:bg-gray-100 dark:focus:bg-gray-800"
              >
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
