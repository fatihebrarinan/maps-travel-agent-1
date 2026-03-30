# Smart Travel Agent

A sophisticated routing and traveling engine built with Python, Flask, and the Google Maps API. This application calculates optimal travel routes and utilizes a custom weighted ranking algorithm to dynamically filter and discover top-rated points of interest along a user's specific journey.

## Core Features

- **Algorithmic Ranking Engine**: Scoring algorithm that uses star ratings and total review counts to reliably obtain the most significant attractions.
- **Route Filtering**: A filtering system that recommends attractions specifically positioned along the calculated route, which optimizes travel routes dynamically.
- **Transit Integration**: Uses Google Directions API to provide real-time travel estimates for both driving and public transportation.
- **RESTful Flask Backend**: Structured a backend with modular API endpoints (/search_city_attractions, /get_route_attractions) to efficiently handle asynchronous client requests.

## Tech Stack

- **Backend**: Python, Flask
- **External APIs**: Google Maps Platform (Places, Directions, Geocoding, and Maps JavaScript APIs)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## Installation & Setup

1. Clone the repository:

    git clone https://github.com/fatihebrarinan/maps-travel-agent-1.git
    cd maps-travel-agent-1

2. Install the required dependencies:

    pip install -r requirements.txt

3. Set up your Google Maps API Key:
   - Go to the Google Cloud Console.
   - Enable Maps JavaScript API, Directions API, Places API, and Geocoding API.
   - Generate an API Key.

4. Configure your environment variables (create a .env file in the root directory):

    GOOGLE_MAPS_API_KEY=your_actual_api_key_here

5. Run the application:

    python app.py

6. Open your browser and navigate to http://localhost:5000
