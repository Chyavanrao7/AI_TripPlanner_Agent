"""
Enhanced Firecrawl tools for web scraping flight and hotel data
"""

import os
import json
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.tools import tool
from datetime import datetime
import asyncio
import re

try:
    from firecrawl import FirecrawlApp
    FIRECRAWL_AVAILABLE = True
except ImportError:
    FIRECRAWL_AVAILABLE = False
    FirecrawlApp = Any

class FlightSearchInput(BaseModel):
    origin: str = Field(description="Origin city or airport code (e.g., 'New York', 'JFK')")
    destination: str = Field(description="Destination city or airport code (e.g., 'Los Angeles', 'LAX')")
    departure_date: str = Field(description="Departure date in YYYY-MM-DD format")
    return_date: Optional[str] = Field(None, description="Return date in YYYY-MM-DD format for round trip")
    num_adults: int = Field(description="Number of adult passengers", default=1)
    formatted_output: Optional[bool] = Field(default=True, description="If True, return a formatted string for display; otherwise return JSON.")

class HotelSearchInput(BaseModel):
    destination: str = Field(description="Destination city for hotel search")
    check_in_date: str = Field(description="Check-in date in YYYY-MM-DD format")
    check_out_date: str = Field(description="Check-out date in YYYY-MM-DD format")
    num_adults: int = Field(description="Number of adult guests", default=1)

def get_firecrawl_app() -> Optional[FirecrawlApp]:
    """Initialize Firecrawl app with API key"""
    if not FIRECRAWL_AVAILABLE:
        return None
    
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        print("WARNING: FIRECRAWL_API_KEY not found in environment variables")
        return None
    
    try:
        return FirecrawlApp(api_key=api_key)
    except Exception as e:
        print(f"ERROR: Failed to initialize FirecrawlApp: {e}")
        return None

@tool("firecrawl_flight_search", args_schema=FlightSearchInput)
async def firecrawl_flight_search_tool(
    origin: str, 
    destination: str, 
    departure_date: str, 
    num_adults: int = 1,
    return_date: Optional[str] = None,
    formatted_output: Optional[bool] = True
) -> str:
    """
    Search for flights using Firecrawl web scraping (Skyscanner only).
    Returns comprehensive flight options with airline, price, times, duration, and route details.
    If formatted_output=True, returns a markdown-formatted string for chat/web display; otherwise returns JSON.
    """
    app = get_firecrawl_app()
    if not app:
        return json.dumps({
            "error": "Firecrawl not available or API key not set",
            "flights": []
        })
    try:
        def format_flight_markdown(flights: list) -> str:
            if not flights:
                return "No flights found."
            lines = ["### ✈️ FLIGHT OPTIONS:"]
            for i, flight in enumerate(flights, 1):
                lines.append(f"**{i}. {flight.get('airline', 'N/A')}** - {flight.get('price', 'N/A')}")
                dep = flight.get('departure_time', 'N/A')
                arr = flight.get('arrival_time', 'N/A')
                dur = flight.get('duration', 'N/A')
                stops = flight.get('stops', 'N/A')
                lines.append(f"   • {dep} → {arr} ({dur})")
                lines.append(f"   • {stops}")
                link = flight.get('booking_link', '')
                if link:
                    lines.append(f"   • [Book this flight]({link})")
                lines.append("")
            return "\n".join(lines)
        def format_for_skyscanner(loc):
            return loc.strip().replace(' ', '-').lower()
        origin_code = format_for_skyscanner(origin)
        dest_code = format_for_skyscanner(destination)
        try:
            date_obj = datetime.strptime(departure_date, '%Y-%m-%d')
            skyscanner_date = date_obj.strftime('%y%m%d')
        except:
            skyscanner_date = departure_date.replace('-', '')[-6:]
        skyscanner_booking_link = f"https://www.skyscanner.co.in/transport/flights/{origin_code}/{dest_code}/{skyscanner_date}/?adultsv2={num_adults}&cabinclass=economy&childrenv2=&ref=home&rtn=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false"
        sites = [
            {
                "name": "Skyscanner",
                "url": skyscanner_booking_link.replace('.co.in', '.com'),
                "schema": {
                    "type": "object",
                    "properties": {
                        "flights": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "airline": {"type": "string"},
                                    "flight_number": {"type": "string"},
                                    "price": {"type": "string"},
                                    "departure_time": {"type": "string"},
                                    "arrival_time": {"type": "string"},
                                    "departure_airport": {"type": "string"},
                                    "arrival_airport": {"type": "string"},
                                    "duration": {"type": "string"},
                                    "stops": {"type": "string"},
                                    "aircraft_type": {"type": "string"}
                                },
                                "required": ["airline", "price", "departure_time", "arrival_time"]
                            }
                        }
                    }
                },
                "prompt": f"""
                Extract ALL flight search results from this Skyscanner.com page for flights from {origin} to {destination} on {departure_date}.
                Look for multiple flight options, different airlines, various departure times, both nonstop and connecting flights, and different price points. For each flight, extract: airline name, flight number if visible, total price (with currency), departure time, arrival time, departure airport, arrival airport, flight duration, number of stops and layover cities if applicable, aircraft type if shown. Ignore sponsored results, ads, or incomplete listings. Focus on actual bookable flight options.
                """
            }
        ]
        for site in sites:
            try:
                print(f"Firecrawl Flight Search: Scraping {site['name']} {site['url']}")
                result = app.scrape_url(
                    url=site["url"],
                    formats=["extract"],
                    extract={
                        "schema": site["schema"],
                        "prompt": site["prompt"]
                    },
                    timeout=90000,
                    wait_for=8000
                )
                if hasattr(result, 'extract') and result.extract:
                    data = result.extract
                    if 'flights' in data and isinstance(data['flights'], list) and data['flights']:
                        flights = []
                        for f in data['flights'][:12]:
                            flight = dict(f)
                            flight['booking_link'] = skyscanner_booking_link
                            flights.append(flight)
                        if formatted_output:
                            return format_flight_markdown(flights)
                        return json.dumps({
                            "flights": flights,
                            "search_info": {
                                "origin": origin,
                                "destination": destination,
                                "departure_date": departure_date,
                                "return_date": return_date,
                                "num_adults": num_adults,
                                "total_found": len(data['flights']),
                                "source": site['name']
                            }
                        })
            except Exception as e:
                print(f"Firecrawl Flight Search Error ({site['name']}): {e}")
                continue
        if formatted_output:
            return "No flights found."
        return json.dumps({
            "flights": [],
            "message": "No flight data could be extracted from Skyscanner.",
            "search_info": {
                "origin": origin,
                "destination": destination,
                "departure_date": departure_date,
                "return_date": return_date,
                "num_adults": num_adults
            }
        })
    except Exception as e:
        print(f"Firecrawl Flight Search Error: {e}")
        if formatted_output:
            return f"Flight search failed: {str(e)}"
        return json.dumps({
            "error": f"Flight search failed: {str(e)}",
            "flights": []
        })

@tool("firecrawl_hotel_search", args_schema=HotelSearchInput)
async def firecrawl_hotel_search_tool(
    destination: str,
    check_in_date: str,
    check_out_date: str,
    num_adults: int = 1,
    formatted_output: Optional[bool] = True
) -> str:
    """
    Search for hotels using Firecrawl web scraping.
    Returns comprehensive hotel options with name, price, rating, location, and amenities.
    If formatted_output=True, returns a markdown-formatted string for chat/web display; otherwise returns JSON.
    """
    app = get_firecrawl_app()
    if not app:
        return json.dumps({
            "error": "Firecrawl not available or API key not set",
            "hotels": []
        })
    try:
        def format_hotel_markdown(hotels: list) -> str:
            if not hotels:
                return "No hotels found."
            lines = ["### 🏨 HOTEL OPTIONS:"]
            for i, hotel in enumerate(hotels, 1):
                lines.append(f"**{i}. {hotel.get('name', 'N/A')}** - {hotel.get('price_per_night', 'N/A')}/night")
                lines.append(f"   • Rating: {hotel.get('rating', 'N/A')}")
                lines.append(f"   • Location: {hotel.get('location', 'N/A')}")
                lines.append(f"   • Amenities: {hotel.get('amenities', 'N/A')}")
                link = hotel.get('booking_link', '')
                if link:
                    lines.append(f"   • [Book this hotel]({link})")
                lines.append("")
            return "\n".join(lines)
        sites_to_try = [
            {
                "name": "Booking.com",
                "url_template": "https://www.booking.com/searchresults.html?ss={destination}&checkin={checkin}&checkout={checkout}&group_adults={adults}&no_rooms=1",
                "schema": {
                    "type": "object",
                    "properties": {
                        "hotels": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string", "description": "Hotel name"},
                                    "price_per_night": {"type": "string", "description": "Price per night with currency"},
                                    "rating": {"type": "string", "description": "Hotel rating or review score"},
                                    "location": {"type": "string", "description": "Hotel location/neighborhood"},
                                    "amenities": {"type": "string", "description": "Key amenities or features"},
                                    "review_score": {"type": "string", "description": "Customer review score if available"},
                                    "total_reviews": {"type": "string", "description": "Number of reviews"},
                                    "distance_from_center": {"type": "string", "description": "Distance from city center"}
                                },
                                "required": ["name", "price_per_night"]
                            }
                        }
                    }
                }
            },
        ]
        destination_formatted = destination.replace(' ', '+')
        try:
            checkin = datetime.strptime(check_in_date, '%Y-%m-%d')
            checkout = datetime.strptime(check_out_date, '%Y-%m-%d')
            checkin_str = checkin.strftime('%Y-%m-%d')
            checkout_str = checkout.strftime('%Y-%m-%d')
        except:
            checkin_str = check_in_date
            checkout_str = check_out_date
        site = sites_to_try[0]
        url = site["url_template"].format(
            destination=destination_formatted,
            checkin=checkin_str,
            checkout=checkout_str,
            adults=num_adults
        )
        print(f"Firecrawl Hotel Search: Scraping {url}")
        hotel_prompt = f"""
        Extract hotel search results from this {site['name']} booking page. \nFind available hotels in {destination} for check-in on {check_in_date} and check-out on {check_out_date} for {num_adults} adults.\n\nLook for:\n1. Multiple hotel options (aim for 8-12 hotels if available)\n2. Different price ranges (budget to luxury)\n3. Various locations within the city\n4. Different star ratings and guest review scores\n\nFor each hotel, extract:\n- Hotel name (full official name)\n- Price per night with currency\n- Star rating (1-5 stars)\n- Guest review rating/score\n- Location/neighborhood\n- Key amenities (WiFi, pool, gym, spa, etc.)\n- Number of reviews if shown\n- Distance from city center if mentioned\n\nFocus on actual available hotels with real pricing, ignore ads or featured listings without prices.\n        """
        result = app.scrape_url(
            url=url,
            formats=["extract"],
            extract={
                "schema": site["schema"],
                "prompt": hotel_prompt
            },
            timeout=90000,
            wait_for=8000
        )
        if hasattr(result, 'extract') and result.extract:
            hotels_data = result.extract
            hotels_list = []
            if isinstance(hotels_data, dict):
                if 'hotels' in hotels_data:
                    hotels_list = hotels_data['hotels']
            if hotels_list:
                for hotel in hotels_list:
                    hotel['booking_link'] = url
                if formatted_output:
                    return format_hotel_markdown(hotels_list)
                return json.dumps({
                    "hotels": hotels_list[:10],
                    "search_info": {
                        "destination": destination,
                        "check_in_date": check_in_date,
                        "check_out_date": check_out_date,
                        "num_adults": num_adults,
                        "total_found": len(hotels_list),
                        "source": site["name"]
                    }
                })
        if formatted_output:
            return "No hotels found."
        return await _fallback_hotel_search(app, destination, check_in_date, check_out_date, num_adults)
    except Exception as e:
        print(f"Firecrawl Hotel Search Error: {e}")
        if formatted_output:
            return f"Hotel search failed: {str(e)}"
        return json.dumps({
            "error": f"Hotel search failed: {str(e)}",
            "hotels": []
        })

ENHANCED_FIRECRAWL_TOOLS = [firecrawl_flight_search_tool, firecrawl_hotel_search_tool]

def are_firecrawl_tools_available() -> bool:
    """Check if Firecrawl tools can be used"""
    return FIRECRAWL_AVAILABLE and os.getenv("FIRECRAWL_API_KEY") is not None

async def test_hotel_search():
    """Test the hotel search functionality"""
    result = await firecrawl_hotel_search_tool(
        destination="Los Angeles",
        check_in_date="2025-01-20",
        check_out_date="2025-01-24",
        num_adults=2
    )
    print("Hotel Search Test Result:")
    print(json.dumps(json.loads(result), indent=2))

if __name__ == "__main__":
    print("Testing Enhanced Firecrawl Hotel Search...")
    asyncio.run(test_hotel_search())