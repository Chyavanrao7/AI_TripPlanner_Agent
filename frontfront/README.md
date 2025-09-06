# AI Trip Planner Frontend

A modern, responsive web application for AI-powered trip planning built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🔐 Authentication System
- Email/password login and signup
- Guest mode for quick access
- Session persistence with localStorage
- User profile management
- Secure form validation

### 💬 Chat Interface
- Full-screen chat layout with collapsible sidebar
- Real-time message streaming
- Markdown support for rich formatting
- Typing indicators and message status
- Auto-scroll to latest messages
- Message timestamps and actions (copy, share)

### 📚 Trip History Management
- Persistent conversation history
- Search functionality across all trips
- Session titles with smart destination detection
- Delete/archive conversations
- Recent conversations prioritized

### 🎨 Modern Design
- Travel-inspired color scheme (blues and greens)
- Responsive design for desktop, tablet, and mobile
- Dark/light mode support
- Smooth animations and transitions
- Loading states and error handling
- Professional typography with Inter font

### 🚀 Technical Features
- Built with Next.js 14 and TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Context-based state management
- API integration ready for FastAPI backend
- Accessibility compliance (ARIA labels, keyboard navigation)
- Error boundaries and proper error handling

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- FastAPI backend running on localhost:8000

### Installation

1. Clone or download the project files
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create environment file:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Update the API URL in \`.env.local\` if needed:
   \`\`\`
   NEXT_PUBLIC_API_URL=http://localhost:8000
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

The frontend is configured to work with a FastAPI backend with the following endpoints:

### Authentication
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/signup\` - User registration

### Chat
- \`POST /api/chat\` - Send message and get AI response
- \`GET /api/chat/history/{session_id}\` - Get conversation history
- \`GET /api/user/{user_id}/sessions\` - Get user's sessions
- \`DELETE /api/chat/{session_id}\` - Delete conversation

### Expected API Response Formats

#### Login/Signup Response
\`\`\`json
{
  "user": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
\`\`\`

#### Chat Response
\`\`\`json
{
  "response": "Here's your trip plan for Tokyo...",
  "session_id": "session_123"
}
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── chat/             # Chat interface components
│   ├── ui/               # Reusable UI components
│   └── theme-provider.tsx
├── contexts/             # React contexts
│   ├── auth-context.tsx  # Authentication state
│   └── chat-context.tsx  # Chat state management
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions
\`\`\`

## Key Components

### Authentication
- **AuthPage**: Main authentication interface
- **LoginForm**: Email/password login
- **SignupForm**: User registration
- **Guest Mode**: Quick access without account

### Chat Interface
- **ChatInterface**: Main chat layout with sidebar
- **ChatArea**: Message display and input
- **MessageBubble**: Individual message rendering
- **TripHistorySidebar**: Conversation history management
- **WelcomeScreen**: Onboarding with sample queries

### State Management
- **AuthContext**: User authentication and session management
- **ChatContext**: Chat sessions, messages, and API communication

## Customization

### Styling
- Modify \`app/globals.css\` for global styles
- Update \`tailwind.config.js\` for theme customization
- Customize color schemes in CSS variables

### API Configuration
- Update \`NEXT_PUBLIC_API_URL\` in environment variables
- Modify API calls in context files for different backend structures

### Features
- Add new sample queries in \`welcome-screen.tsx\`
- Customize message formatting in \`message-bubble.tsx\`
- Extend user profile features in \`auth-context.tsx\`

## Deployment

### Build for Production
\`\`\`bash
npm run build
npm start
\`\`\`

This project is licensed under the MIT License.
