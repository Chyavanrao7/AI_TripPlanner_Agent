# AI Trip Planner

An AI-powered trip planning application that provides personalized travel recommendations, real-time booking data, and intelligent itinerary generation through natural conversation.

## What It Does

- **Smart Trip Planning**: AI-powered travel planning through natural conversation
- **Real-Time Data**: Live flight and hotel search with current prices
- **Personalized Recommendations**: Custom itineraries based on your interests and preferences
- **Interactive Chat**: Natural conversation interface for planning your perfect trip

## Tech Stack

### Backend
- **FastAPI** - Python web framework
- **Google Gemini 2.0 Flash** - AI language model
- **Redis** - Session storage and caching
- **Firecrawl** - Web scraping for real-time data

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Styling
- **Radix UI** - Component library

## Key Functionalities

### AI-Powered Planning
- Natural language trip planning conversations
- Automatic extraction of travel preferences, dates, and requirements
- Context-aware conversations with memory across sessions
- Dynamic itinerary generation based on interests

### Real-Time Data
- Live flight search with current prices from Skyscanner
- Real-time hotel availability and pricing from Booking.com
- Direct booking links to travel platforms
- Current market rates and availability

### User Experience
- Responsive design for all devices
- Dark/light mode support
- Guest mode - try without registration
- Persistent conversation history
- Streaming AI responses with typing indicators

## Quick Start

### Backend Setup
```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontfront
npm install
npm run dev
```

### Environment Variables
Create `.env` files with:
- `GOOGLE_API_KEY` - Your Google AI API key
- `FIRECRAWL_API_KEY` - Your Firecrawl API key (optional)
- `REDIS_URL` - Redis connection string

## License

MIT License - see LICENSE file for details.