"""
Trip Planner with Firecrawl web scraping for real flight and hotel data
"""

import os
import json
from typing import List, Dict, Any, Optional, Literal, TypedDict, Annotated
from datetime import datetime, timedelta
import asyncio
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI 
from langchain_core.tools import tool
from dotenv import load_dotenv

from enhanced_tools_firecrawl import (
    firecrawl_hotel_search_tool,
    are_firecrawl_tools_available
)

try:
    from enhanced_tools_firecrawl import firecrawl_flight_search_tool
    SKYSCANNER_AVAILABLE = True
except ImportError:
    from enhanced_tools_firecrawl import firecrawl_flight_search_tool as skyscanner_flight_search_tool
    SKYSCANNER_AVAILABLE = False
    print("Enhanced Skyscanner tool not found, using original flight search")

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7,
)

class TripPlannerState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    trip_context: Dict[str, Any]
    current_task: str

class ItineraryGeneratorInput(BaseModel):
    destination: str = Field(description="Destination city/country")
    start_date: str = Field(description="Trip start date in YYYY-MM-DD format")
    end_date: str = Field(description="Trip end date in YYYY-MM-DD format")
    travelers: int = Field(description="Number of travelers")
    interests: Optional[List[str]] = Field(default_factory=list, description="Travel interests")
    budget: Optional[str] = Field(None, description="Budget range")

@tool("generate_itinerary", args_schema=ItineraryGeneratorInput)
def generate_itinerary(
    destination: str,
    start_date: str,
    end_date: str,
    travelers: int,
    interests: Optional[List[str]] = None,
    budget: Optional[str] = None
) -> str:
    """Generate a comprehensive itinerary"""
    try:
        print(f"Generating itinerary for {destination}")
        
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        duration_days = (end - start).days + 1
        
        interests_str = ', '.join(interests) if interests else 'general sightseeing'
        attractions = {
            "paris": {
                "art": ["Louvre Museum", "Musée d'Orsay", "Centre Pompidou", "Rodin Museum"],
                "food": ["Le Marais Food Tour", "Cooking Class at La Cuisine Paris", "Wine Tasting in Montmartre", "Market Visit at Marché des Enfants Rouges"],
                "general": ["Eiffel Tower", "Arc de Triomphe", "Notre-Dame", "Sacré-Cœur"],
                "neighborhoods": ["Montmartre", "Le Marais", "Saint-Germain", "Latin Quarter"]
            },
            "rome": {
                "history": ["Colosseum & Roman Forum", "Vatican Museums", "Pantheon", "Borghese Gallery"],
                "food": ["Trastevere Food Tour", "Pasta Making Class", "Wine Tasting", "Campo de' Fiori Market"],
                "general": ["Trevi Fountain", "Spanish Steps", "Piazza Navona", "Villa Borghese"],
                "neighborhoods": ["Trastevere", "Centro Storico", "Testaccio", "Monti"]
            },
            "los angeles": {
                "entertainment": ["Hollywood Walk of Fame", "Universal Studios", "Getty Center", "Griffith Observatory"],
                "food": ["Santa Monica Pier Food Tour", "Korean BBQ in Koreatown", "Taco Tour in East LA", "Farmers Market"],
                "general": ["Santa Monica Beach", "Venice Beach", "Hollywood Sign", "Rodeo Drive"],
                "neighborhoods": ["Hollywood", "Beverly Hills", "Santa Monica", "Venice"]
            }
        }
        
        dest_key = destination.lower()
        dest_attractions = attractions.get(dest_key, attractions["paris"])
        
        itinerary = f"# 🌟 {duration_days}-Day {destination} Itinerary\n\n"
        itinerary += f"**Travelers:** {travelers} {'person' if travelers == 1 else 'people'}\n"
        itinerary += f"**Dates:** {start_date} to {end_date}\n"
        itinerary += f"**Interests:** {interests_str}\n"
        if budget:
            itinerary += f"**Budget:** {budget}\n"
        itinerary += "\n---\n\n"
        
        for day in range(duration_days):
            current_date = start + timedelta(days=day)
            date_str = current_date.strftime("%A, %B %d, %Y")
            
            itinerary += f"## Day {day + 1} - {date_str}\n\n"
            
            if day == 0:
                itinerary += "### Morning\n"
                itinerary += "- Arrival at airport\n"
                itinerary += f"- Transfer to hotel (consider pre-booking airport transfer)\n"
                itinerary += "- Hotel check-in and freshen up\n\n"
                
                itinerary += "### Afternoon\n"
                itinerary += f"- Light lunch at a café near your hotel\n"
                itinerary += f"- Gentle walking tour of {dest_attractions['neighborhoods'][0]}\n"
                itinerary += "- Get oriented with the city\n\n"
                
                itinerary += "### Evening\n"
                itinerary += "- Welcome dinner at a local restaurant\n"
                itinerary += "- Early rest to overcome jet lag\n\n"
                
            elif day == duration_days - 1:
                itinerary += "### Morning\n"
                itinerary += "- Hotel checkout (store luggage if late flight)\n"
                itinerary += "- Last-minute souvenir shopping\n"
                itinerary += "- Visit a local café for breakfast\n\n"
                
                itinerary += "### Afternoon\n"
                itinerary += "- Light lunch\n"
                itinerary += "- Departure to airport (arrive 3 hours before international flight)\n\n"
                
            else:
                itinerary += "### Morning (9:00 AM - 12:30 PM)\n"
                
                if interests and "art" in interests and "art" in dest_attractions:
                    itinerary += f"- Visit {dest_attractions['art'][day % len(dest_attractions['art'])]}\n"
                elif interests and "food" in interests and "food" in dest_attractions:
                    itinerary += f"- {dest_attractions['food'][day % len(dest_attractions['food'])]}\n"
                elif interests and "history" in interests and "history" in dest_attractions:
                    itinerary += f"- Explore {dest_attractions['history'][day % len(dest_attractions['history'])]}\n"
                elif interests and "entertainment" in interests and "entertainment" in dest_attractions:
                    itinerary += f"- Visit {dest_attractions['entertainment'][day % len(dest_attractions['entertainment'])]}\n"
                else:
                    itinerary += f"- Visit {dest_attractions['general'][day % len(dest_attractions['general'])]}\n"
                
                itinerary += "- Coffee break at a local café\n\n"
                
                itinerary += "### Afternoon (12:30 PM - 6:00 PM)\n"
                itinerary += "- Lunch at a recommended restaurant\n"
                itinerary += f"- Explore {dest_attractions['neighborhoods'][(day+1) % len(dest_attractions['neighborhoods'])]}\n"
                itinerary += "- Shopping or additional sightseeing\n"
                itinerary += "- Afternoon break at a local café\n\n"
                
                itinerary += "### Evening (6:00 PM - 10:00 PM)\n"
                itinerary += "- Aperitif at a wine bar\n"
                itinerary += "- Dinner at a local restaurant\n"
                itinerary += "- Evening stroll or cultural performance\n\n"
            
            itinerary += "**🚇 Transportation:** Metro day pass recommended (~€8-15)\n"
            itinerary += "**💰 Estimated Daily Cost:** €100-150 per person (meals, transport, attractions)\n\n"
            itinerary += "---\n\n"
        
        itinerary += "## 📍 Practical Information\n\n"
        itinerary += "### Getting Around\n"
        itinerary += f"- {destination} has excellent public transportation\n"
        itinerary += "- Consider buying a multi-day transport pass\n"
        itinerary += "- Download offline maps and transport apps\n\n"
        
        itinerary += "### Budget Breakdown (per person)\n"
        if budget:
            try:
                budget_amount = int(budget.replace("$", "").replace(",", "").replace("USD", "").strip())
                per_person_budget = budget_amount / travelers
                daily_budget = per_person_budget / duration_days
                
                itinerary += f"- Total Budget: ${budget_amount} ({travelers} people)\n"
                itinerary += f"- Per Person: ${per_person_budget:.0f}\n"
                itinerary += f"- Daily Budget: ${daily_budget:.0f}/person/day\n"
                itinerary += f"- Suggested allocation:\n"
                itinerary += f"  - Accommodation: 30-40% (${daily_budget * 0.35:.0f}/day)\n"
                itinerary += f"  - Food: 30-35% (${daily_budget * 0.32:.0f}/day)\n"
                itinerary += f"  - Activities: 20-25% (${daily_budget * 0.22:.0f}/day)\n"
                itinerary += f"  - Transport/Misc: 10-15% (${daily_budget * 0.11:.0f}/day)\n"
            except:
                itinerary += "- Budget allocation depends on your travel style\n"
        
        itinerary += "\n### Tips\n"
        itinerary += f"- Book {destination} museum tickets online in advance\n"
        itinerary += "- Many museums offer free entry on first Sunday of month\n"
        itinerary += "- Restaurant reservations recommended for dinner\n"
        itinerary += "- Keep copies of important documents\n"
        
        return itinerary
        
    except Exception as e:
        print(f"Itinerary generation error: {e}")
        return f"Error generating itinerary: {str(e)}"



def extract_trip_context(messages: List[BaseMessage]) -> Dict[str, Any]:
    """Extract trip context from conversation history with improved date handling"""
    context = {
        "destination": None, "origin": None, "dates": {"start": None, "end": None},
        "travelers": None, "interests": [], "budget": None, "trip_type": None
    }
    
    import re
    from datetime import datetime, timedelta

    all_content = " ".join([msg.content for msg in messages if isinstance(msg, (HumanMessage, AIMessage))])
    all_content_lower = all_content.lower()

    locations = {
        "paris": "Paris", "london": "London", "tokyo": "Tokyo", "rome": "Rome", 
        "new york": "New York", "barcelona": "Barcelona", "amsterdam": "Amsterdam", 
        "berlin": "Berlin", "bangkok": "Bangkok", "dubai": "Dubai", 
        "mumbai": "Mumbai", "los angeles": "Los Angeles", "delhi": "Delhi",
        "bangalore": "Bangalore", "bengaluru": "Bangalore"
    }
    for loc_key, loc_val in locations.items():
        if re.search(r'to\s+' + loc_key, all_content_lower): context["destination"] = loc_val
        if re.search(r'from\s+' + loc_key, all_content_lower): context["origin"] = loc_val
    if not context["destination"] or not context["origin"]:
        for loc_key, loc_val in locations.items():
            if loc_key in all_content_lower:
                if not context["destination"] and (context.get("origin") != loc_val): context["destination"] = loc_val
                if not context["origin"]: context["origin"] = loc_val

    full_date_pattern = r'(\d{4}-\d{2}-\d{2})'
    month_pattern = r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})'
    checkin_pattern = r'check\s*-?in\s*(?:on)?\s*(?:the)?\s*(\d{1,2})'
    checkout_pattern = r'check\s*-?out\s*(?:on)?\s*(?:the)?\s*(\d{1,2})'

    full_dates = re.findall(full_date_pattern, all_content)
    month_matches = re.findall(month_pattern, all_content_lower)
    checkin_matches = re.findall(checkin_pattern, all_content_lower)
    checkout_matches = re.findall(checkout_pattern, all_content_lower)

    base_month, base_year = None, datetime.now().year
    month_names = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    if month_matches:
        month_name = month_matches[-1][0]
        base_month = month_names.index(month_name) + 1
        if base_month < datetime.now().month:
            base_year += 1
    
    start_date, end_date = None, None
    if full_dates:
        start_date = full_dates[0]
        if len(full_dates) > 1:
            end_date = full_dates[-1]

    if checkin_matches and base_month:
        day = int(checkin_matches[-1])
        start_date = f"{base_year}-{base_month:02d}-{day:02d}"

    if checkout_matches and base_month:
        day = int(checkout_matches[-1])
        end_date = f"{base_year}-{base_month:02d}-{day:02d}"

    if start_date: context["dates"]["start"] = start_date
    if end_date: context["dates"]["end"] = end_date

    if context["dates"]["start"] and context["dates"]["end"]:
        if context["dates"]["start"] > context["dates"]["end"]:
            print(f"Swapping inverted dates: {context['dates']['start']} and {context['dates']['end']}")
            context["dates"]["start"], context["dates"]["end"] = context["dates"]["end"], context["dates"]["start"]

    traveler_patterns = [
        (r'(\d+)\s*(?:passengers?|people|person|travelers?|adults?)', lambda x: int(x)),
        (r'for\s+(\d+)', lambda x: int(x)),
        (r'family\s+of\s+(\d+)', lambda x: int(x)),
        (r'a couple|two(?:\s+people)?', lambda: 2),
        (r'solo|alone|just\s+me|myself|one person', lambda: 1),
    ]
    for pattern, converter in traveler_patterns:
        match = re.search(pattern, all_content_lower)
        if match:
            try:
                if match.groups(): context["travelers"] = converter(match.group(1))
                else: context["travelers"] = converter()
                break
            except Exception: pass

    interest_keywords = {"art": ["art", "museum"], "food": ["food", "cuisine"], "history": ["history", "historical"], "nature": ["nature", "park"], "shopping": ["shopping", "market"], "nightlife": ["nightlife", "club"]}
    for interest, keywords in interest_keywords.items():
        if any(keyword in all_content_lower for keyword in keywords):
            if interest not in context["interests"]: context["interests"].append(interest)

    budget_patterns = [r'\$\s*(\d+(?:,\d+)?)', r'(\d+(?:,\d+)?)\s*dollars', r'budget\s*of\s*\$?(\d+)']
    for pattern in budget_patterns:
        match = re.search(pattern, all_content, re.IGNORECASE)
        if match:
            context["budget"] = f"${match.group(1).replace(',', '')}"
            break
    
    return context

async def agent_node(state: TripPlannerState) -> TripPlannerState:
    """Main LLM agent that maintains context and decides actions"""
    
    context = extract_trip_context(state["messages"])
    state["trip_context"] = context
    
    context_summary = f"""
Current Trip Context:
- Destination: {context.get('destination', 'Not specified')}
- Origin: {context.get('origin', 'Not specified')}
- Travel Dates: {context['dates'].get('start', 'Not specified')} to {context['dates'].get('end', 'Not specified')}
- Travelers: {context.get('travelers', 'Not specified')}
- Interests: {', '.join(context['interests']) if context['interests'] else 'Not specified'}
- Budget: {context.get('budget', 'Not specified')}
"""
    
    firecrawl_status = "Available" if are_firecrawl_tools_available() else "Not Available (requires FIRECRAWL_API_KEY)"
    
    system_prompt = f"""You are TripGenie, an expert AI travel assistant with perfect memory of our conversation.

{context_summary}

FIRECRAWL WEB SCRAPING STATUS: {firecrawl_status}

IMPORTANT BEHAVIORS:
1. **Memory**: Remember ALL details from our conversation. Never ask for information already provided.
2. **Context Awareness**: Use the context above to auto-fill tool parameters.
3. **Smart Responses**: 
   - For general travel questions → Answer directly without tools
   - For flight searches → Use firecrawl_flight_search (real-time flight data)
   - For hotel searches → Use firecrawl_hotel_search (real web scraping)
   - For itinerary requests → Use generate_itinerary tool
4. **Progressive Building**: Build understanding across messages. Reference previous information naturally.

TOOL USAGE RULES:
- Flight/Hotel searches now use REAL web scraping via Firecrawl
- Only use tools when user explicitly asks for searches or planning
- Auto-fill ALL parameters from context when available
- If critical information is missing, ask for it before calling tools

REAL DATA NOTICE:
- Flight searches scrape live data from Kayak/other sources
- Hotel searches scrape live data from Booking.com/Hotels.com
- Results are real, current prices and availability
- Response times may be longer due to live web scraping

Remember: You have access to the entire conversation history. Act like a human assistant who remembers everything discussed."""

    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    
    if are_firecrawl_tools_available():
        tools = [firecrawl_flight_search_tool, firecrawl_hotel_search_tool, generate_itinerary]
        print("Using Skyscanner + Firecrawl tools for real web scraping")
    else:
        tools = [generate_itinerary]
        print("Firecrawl not available, limited to itinerary generation only")
    
    llm_with_tools = llm.bind_tools(tools)
    
    response = await llm_with_tools.ainvoke(messages)
    
    state["messages"].append(response)
    
    if response.tool_calls:
        state["current_task"] = "execute_tools"
    else:
        state["current_task"] = "respond"
    
    return state

async def tool_node(state: TripPlannerState) -> TripPlannerState:
    """Execute tools and return results to main agent"""
    
    last_message = state["messages"][-1]
    
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        for tool_call in last_message.tool_calls:
            tool_name = tool_call.get("name")
            tool_args = tool_call.get("args", {})
            tool_id = tool_call.get("id")
            
            print(f"Executing {tool_name} with args: {tool_args}")
            
            if tool_name == "firecrawl_flight_search":
                print("Scraping live flight data from Firecrawl...")
                tool_args = dict(tool_args)
                tool_args['formatted_output'] = True
                result = await firecrawl_flight_search_tool.ainvoke(tool_args)
            elif tool_name == "firecrawl_hotel_search":
                print("Scraping live hotel data...")
                result = await firecrawl_hotel_search_tool.ainvoke(tool_args)
            elif tool_name == "generate_itinerary":
                print("Generating custom itinerary...")
                result = generate_itinerary.invoke(tool_args)
            else:
                result = json.dumps({"error": f"Unknown tool: {tool_name}"})
            
            tool_message = ToolMessage(
                content=result,
                tool_call_id=tool_id
            )
            state["messages"].append(tool_message)
    
    state["current_task"] = "finalize_response"
    return state

async def response_node(state: TripPlannerState) -> TripPlannerState:
    """Finalize and format the response with real booking data"""
    
    if state["current_task"] == "finalize_response":
        tool_results = []
        for i, msg in enumerate(state["messages"]):
            if isinstance(msg, ToolMessage):
                tool_results.append((i, msg))
        
        if tool_results:
            formatting_prompt = """Based on the REAL scraped data above, provide a well-formatted response.

FORMATTING RULES:

For REAL FLIGHT RESULTS (scraped from Skyscanner):
- Present flights in a clean, organized format
- Include all available details (airline, flight number, times, duration, price)
- Show multiple booking options (Skyscanner, MakeMyTrip, Cleartrip, GoIbibo)
- Format booking links as clickable URLs
- Highlight best value flights or shortest flights
- If no flights found, explain what happened and suggest alternatives

For REAL HOTEL RESULTS (scraped from Booking.com/Hotels.com):
- Create organized cards for each hotel
- Include name, location, rating, price, amenities
- Highlight best value options or highest-rated hotels
- If no hotels found, explain and suggest alternatives

For ITINERARIES:
- Present the complete itinerary as provided
- Highlight key activities for each day
- Include budget breakdown if available

IMPORTANT NOTES:
- This data is scraped live from travel websites
- Prices and availability are current as of the search
- Results may vary based on website content and availability
- Suggest users verify details directly on booking sites

Make the response conversational and helpful. Acknowledge that real-time data was used."""

            messages = state["messages"] + [SystemMessage(content=formatting_prompt)]
            final_response = await llm.ainvoke(messages)
            state["messages"].append(final_response)
    
    return state

def route_next(state: TripPlannerState) -> Literal["tools", "response", "__end__"]:
    """Determine next node based on current task"""
    
    if state["current_task"] == "execute_tools":
        return "tools"
    elif state["current_task"] == "finalize_response":
        return "response"
    else:
        return "__end__"

def create_trip_planner_graph():
    """Create the trip planner graph with proper flow"""
    
    memory = MemorySaver()
    
    graph = StateGraph(TripPlannerState)
    
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_node("response", response_node)
    
    graph.add_edge(START, "agent")
    graph.add_conditional_edges(
        "agent",
        route_next,
        {
            "tools": "tools",
            "response": "response",
            "__end__": END
        }
    )
    graph.add_edge("tools", "agent")
    graph.add_edge("response", END)
    
    return graph.compile(checkpointer=memory)

class FixedTripPlannerWithFirecrawl:
    """Trip planner with real web scraping via Firecrawl"""
    
    def __init__(self):
        self.graph = create_trip_planner_graph()
        self.config = {"configurable": {"thread_id": "main"}}
        
        if are_firecrawl_tools_available():
            print("Fixed Trip Planner with Skyscanner + Firecrawl initialized - REAL web scraping enabled")
        else:
            print("Fixed Trip Planner initialized - Firecrawl not available, limited functionality")
            print("Add FIRECRAWL_API_KEY to environment for full web scraping features")
    
    async def process_message(self, user_input: str, session_id: str = "main") -> Dict[str, Any]:
        """Process user message with real web scraping capabilities"""
        
        print(f"Processing: '{user_input}'")
        
        config = {"configurable": {"thread_id": session_id}}
        
        current_state = self.graph.get_state(config)
        
        if not current_state.values:
            initial_state = {
                "messages": [],
                "trip_context": {},
                "current_task": ""
            }
        else:
            initial_state = current_state.values
        
        initial_state["messages"].append(HumanMessage(content=user_input))
        
        try:
            result = await self.graph.ainvoke(initial_state, config)
            
            final_messages = result["messages"]
            last_ai_message = None
            
            for msg in reversed(final_messages):
                if isinstance(msg, AIMessage) and not isinstance(msg, ToolMessage):
                    last_ai_message = msg
                    break
            
            response_content = last_ai_message.content if last_ai_message else "I'm here to help with your trip planning!"
            
            tools_used = []
            for msg in final_messages:
                if isinstance(msg, AIMessage) and hasattr(msg, 'tool_calls'):
                    for tool_call in msg.tool_calls:
                        tools_used.append(tool_call.get("name"))
            
            return {
                "success": True,
                "response": response_content,
                "context": result.get("trip_context", {}),
                "tools_used": tools_used,
                "session_id": session_id,
                "firecrawl_enabled": are_firecrawl_tools_available()
            }
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "response": f"I apologize, I encountered an error: {str(e)}",
                "context": {},
                "tools_used": [],
                "session_id": session_id,
                "firecrawl_enabled": are_firecrawl_tools_available()
            }

async def run_dynamic_trip_planner(user_input: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
    """Main entry point for the trip planner with Firecrawl"""
    planner = FixedTripPlannerWithFirecrawl()
    
    if conversation_history:
        session_id = f"session_{hash(str(conversation_history))}"
        initial_messages = []
        for msg in conversation_history:
            if msg["role"] == "user":
                initial_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                initial_messages.append(AIMessage(content=msg["content"]))
        
        config = {"configurable": {"thread_id": session_id}}
        initial_state = {
            "messages": initial_messages,
            "trip_context": {},
            "current_task": ""
        }
        planner.graph.update_state(config, initial_state)
    else:
        session_id = f"session_{datetime.now().timestamp()}"
    
    result = await planner.process_message(user_input, session_id)
    
    return {
        "success": result["success"],
        "assistant_responses_for_chat": [{
            "role": "assistant",
            "content": result["response"]
        }],
        "structured_trip_plan": None,
        "updated_conversation_history": conversation_history or [],
        "tool_calls_made": result.get("tools_used", []),
        "error": None if result["success"] else result.get("response"),
        "context_analysis": result.get("context", {}),
        "firecrawl_enabled": result.get("firecrawl_enabled", False)
    }

if __name__ == "__main__":
    print("Fixed Trip Planner with Real Skyscanner + Firecrawl Web Scraping")
    