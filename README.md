# FULLY MADE WITH AI

# Travel Time Estimator

A modern web application that estimates travel times between two locations using both driving and public transit options. Built with Flask and Google Maps API.

## Features

- ⭐ **Smart Travel Recommendations** - Get top-rated places within 500km using professional scoring algorithm
- 🏙️ **City Search** - Search any city worldwide and discover its top 20 attractions using advanced ranking
- 📊 **Professional Ranking** - Combines star ratings and review counts with weighted scoring for reliable results
- 🗺️ Interactive Google Maps interface with custom styling
- 🚗 Driving time and distance estimation
- 🚌 Public transit time estimation with departure/arrival times
- 📱 Responsive design for mobile and desktop
- 🎯 Location autocomplete with Google Places API
- 📍 Current location detection
- 🏛️ Fallback to famous world destinations when location is denied
- 🎨 Beautiful card-based recommendations with ratings and photos
- 🔄 Seamless navigation between all sections
- ⌨️ Keyboard shortcuts for better UX

## Prerequisites

- Python 3.7 or higher
- Google Maps API Key with the following APIs enabled:
  - Maps JavaScript API
  - Directions API
  - Places API
  - Geocoding API

## Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Google Maps API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Directions API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Optionally, restrict the API key to your domain for security

## Configuration

### Method 1: Environment Variable (Recommended)
Set your Google Maps API key as an environment variable:
```bash
# Windows
set GOOGLE_MAPS_API_KEY=your_api_key_here

# macOS/Linux
export GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Method 2: Direct Replacement
Edit `app.py` and replace `YOUR_API_KEY_HERE` with your actual API key:
```python
GOOGLE_MAPS_API_KEY = 'your_actual_api_key_here'
```

### Method 3: .env File
Create a `.env` file in the project root:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

Then install python-dotenv (already in requirements.txt) and add to your app.py:
```python
from dotenv import load_dotenv
load_dotenv()
```

## Running the Application

1. Start the Flask development server:
   ```bash
   python app.py
   ```

2. Open your web browser and go to:
   ```
   http://localhost:5000
   ```

## Usage

### Nearby Recommendations Tab (Default)
1. **Location Detection**: Allow location access for personalized recommendations
2. **Browse Places**: View top 10 rated attractions within 500km of your location
3. **Explore Details**: See ratings, photos, and place types for each recommendation
4. **Quick Travel Time**: Click "Calculate Travel Time" on any recommendation card

### City Search Tab
1. **Search Any City**: Type any city or province name (e.g., "Paris", "Tokyo", "New York")
2. **Discover Attractions**: Get the top 20 most starred attractions in that city
3. **Detailed Information**: View ratings, review counts, photos, and attraction types
4. **Instant Travel Time**: Click "Calculate Travel Time" to get directions from your location

### Travel Calculator Tab
1. **Enter Locations**: Type your starting location and destination in the input fields
2. **Autocomplete**: The app will suggest locations as you type
3. **Calculate**: Click "Calculate Travel Time" or press Enter
4. **View Results**: See estimated times for both driving and public transit
5. **Map Visualization**: The route will be displayed on the interactive map
6. **Route Attractions**: Click "Find attractions in the middle of your route" to discover popular places as map markers
7. **Smart Route Focus**: Only shows attractions in the middle 60% of your route (excludes first and last 20%)
8. **Distance Control**: Set how close attractions should be to your route (1-200km, default 50km)
9. **Interactive Map Markers**: Click attraction markers to see details and get directions

### Navigation
- Use the tabs at the top to switch between **Nearby**, **City Search**, and **Calculator**
- Clicking "Calculate Travel Time" on any attraction automatically switches to the calculator
- Press Enter in search fields to trigger searches

## Professional Ranking Algorithm

The app uses an advanced scoring system to ensure the most reliable and popular attractions are shown first:

### Scoring Components
1. **Star Rating**: Normalized 1-5 star ratings
   - Nearby Places: 70% weight
   - City Search: 65% weight  
   - Route Attractions: 60% weight
2. **Review Count**: Logarithmic scaling to prevent bias toward places with excessive reviews
   - Nearby Places: 30% weight
   - City Search: 35% weight
   - Route Attractions: 40% weight
3. **Quality Bonuses**: Extra points for highly-rated places with substantial review counts
4. **Category Bonuses**: Tourist attractions get slight preference in city searches

### Quality Filters
- **Minimum Rating**: 4.0+ stars required
- **Minimum Reviews**: 5+ for nearby places, 10+ for city attractions
- **Professional Weighting**: Balances popularity with quality

### Result Benefits
- **Reliable Rankings**: Prevents manipulation by fake reviews or rating inflation
- **Popular Destinations**: Ensures well-visited, proven attractions are prioritized
- **Quality Assurance**: Filters out low-quality or questionable establishments
- **Balanced Results**: Combines both rating quality and review volume for trustworthy recommendations

## Smart Route Focus

When searching for attractions along your travel route, the app intelligently focuses on the middle portion of your journey:

### Why Middle-Route Focus?
- **Discovery Purpose**: Travelers want to see new places during their journey, not near familiar start/end points
- **Practical Planning**: Attractions near your origin or destination are likely already known or easily accessible
- **Journey Enhancement**: Focus on the main travel experience rather than departure/arrival areas

### How It Works
- **Route Analysis**: The app calculates the total distance of your route
- **Smart Filtering**: Only searches for attractions in the middle 60% of the route
- **Exclusion Zones**: Skips the first 20% and last 20% of your journey
- **Optimal Discovery**: Ensures attractions are in the most relevant part of your travel experience

### Example
```
Route: New York → Boston (215 miles)
- First 20%: Miles 0-43 (near NYC) → Excluded
- Middle 60%: Miles 43-172 → Attractions shown here
- Last 20%: Miles 172-215 (near Boston) → Excluded
```

### Keyboard Shortcuts

- `Enter`: Calculate travel time when focused on input fields
- `Ctrl/Cmd + Enter`: Calculate travel time from anywhere
- `Ctrl/Cmd + S`: Swap origin and destination locations

## API Endpoints

### GET /
Returns the main application page with the map interface.

### POST /get_recommendations
Gets travel recommendations based on user location or returns famous places as fallback.

**Request Body:**
```json
{
    "lat": 40.7128,
    "lng": -74.0060
}
```

**Response:**
```json
{
    "recommendations": [
        {
            "name": "Central Park",
            "location": "New York, NY",
            "rating": 4.7,
            "types": ["park", "tourist_attraction"],
            "photo_reference": "photo_reference_string"
        }
    ],
    "source": "nearby"
}
```

### POST /search_city_attractions
Searches for top-rated attractions in a specific city worldwide.

**Request Body:**
```json
{
    "city_name": "Paris"
}
```

**Response:**
```json
{
    "attractions": [
        {
            "name": "Eiffel Tower",
            "location": "Paris, France",
            "rating": 4.6,
            "user_ratings_total": 125000,
            "types": ["tourist_attraction"],
            "photo_reference": "photo_reference_string",
            "place_id": "place_id_string"
        }
    ],
    "city": "Paris",
    "count": 20
}
```

### POST /get_route_attractions
Gets popular attractions along a travel route with customizable distance filter.

**Request Body:**
```json
{
    "origin": "New York, NY",
    "destination": "Boston, MA",
    "distance_km": 50
}
```

**Response:**
```json
{
    "attractions": [
        {
            "name": "Mystic Seaport Museum",
            "location": "Mystic, CT",
            "rating": 4.5,
            "user_ratings_total": 8500,
            "types": ["museum", "tourist_attraction"],
            "photo_reference": "photo_reference_string",
            "place_id": "place_id_string"
        }
    ],
    "count": 15,
    "distance_filter": 50
}
```

### POST /get_travel_time
Calculates travel times for both driving and transit.

**Request Body:**
```json
{
    "origin": "New York, NY",
    "destination": "Boston, MA"
}
```

**Response:**
```json
{
    "driving": {
        "duration": "4 hours 15 mins",
        "distance": "215 miles",
        "status": "success"
    },
    "transit": {
        "duration": "4 hours 30 mins",
        "distance": "220 miles",
        "departure_time": "14:30",
        "arrival_time": "19:00",
        "status": "success"
    }
}
```

## File Structure

```
Maps_api_thingy/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── style.css         # CSS styling
    └── script.js         # JavaScript functionality
```

## Customization

### Styling
Edit `static/style.css` to customize the appearance. The app uses:
- Modern gradient backgrounds
- Card-based layout
- Responsive grid system
- Custom animations

### Map Styling
The map uses custom styling defined in `static/script.js`. You can modify the `styles` array in the `initMap()` function to change the map appearance.

### Additional Features
You can extend the app by:
- Adding more travel modes (walking, cycling)
- Implementing route optimization for multiple stops
- Adding traffic information
- Saving favorite routes
- Adding cost estimation for transit

## Troubleshooting

### Common Issues

1. **Map not loading**: Check if your API key is correctly set and has the required APIs enabled
2. **No routes found**: Ensure the locations are valid and accessible by the selected travel mode
3. **Transit times not available**: Public transit information may not be available for all locations
4. **CORS errors**: Make sure you're accessing the app through `localhost:5000` and not opening the HTML file directly

### API Quotas
Google Maps APIs have usage quotas. For development:
- Maps JavaScript API: 28,000 loads per month
- Directions API: 2,500 requests per day
- Places API: 17,000 requests per month

Monitor your usage in the Google Cloud Console.

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the Google Maps API documentation
3. Create an issue in the repository

---

**Note**: This application requires a valid Google Maps API key to function. Make sure to keep your API key secure and consider implementing proper API key restrictions for production use.
