from flask import Flask, render_template, request, jsonify
import requests
import os
from datetime import datetime
import json
import math

app = Flask(__name__)

# You'll need to set your Google Maps API key as an environment variable
# or replace this with your actual API key
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')

# Famous locations fallback when user denies location
FAMOUS_LOCATIONS = [
    {
        'name': 'Times Square',
        'location': 'Times Square, New York, NY, USA',
        'rating': 4.3,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Eiffel Tower',
        'location': 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
        'rating': 4.6,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Central Park',
        'location': 'Central Park, New York, NY, USA',
        'rating': 4.7,
        'types': ['park'],
        'photo_reference': None
    },
    {
        'name': 'Golden Gate Bridge',
        'location': 'Golden Gate Bridge, San Francisco, CA, USA',
        'rating': 4.8,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Statue of Liberty',
        'location': 'Statue of Liberty, New York, NY, USA',
        'rating': 4.5,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Big Ben',
        'location': 'Westminster, London SW1A 0AA, UK',
        'rating': 4.4,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Sydney Opera House',
        'location': 'Bennelong Point, Sydney NSW 2000, Australia',
        'rating': 4.7,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Colosseum',
        'location': 'Piazza del Colosseo, 1, 00184 Roma RM, Italy',
        'rating': 4.6,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Machu Picchu',
        'location': '08680 Machu Picchu, Peru',
        'rating': 4.8,
        'types': ['tourist_attraction'],
        'photo_reference': None
    },
    {
        'name': 'Great Wall of China',
        'location': 'Huairou, China',
        'rating': 4.6,
        'types': ['tourist_attraction'],
        'photo_reference': None
    }
]

@app.route('/')
def index():
    return render_template('index.html', api_key=GOOGLE_MAPS_API_KEY)

@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    try:
        data = request.json
        lat = data.get('lat')
        lng = data.get('lng')
        
        if lat is None or lng is None:
            # Return famous locations if no location provided
            return jsonify({
                'recommendations': FAMOUS_LOCATIONS[:10],
                'source': 'famous'
            })
        
        # Get nearby places using Google Places API
        nearby_places = get_nearby_places(lat, lng)
        
        if nearby_places:
            return jsonify({
                'recommendations': nearby_places,
                'source': 'nearby'
            })
        else:
            # Fallback to famous locations if no nearby places found
            return jsonify({
                'recommendations': FAMOUS_LOCATIONS[:10],
                'source': 'famous'
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search_city_attractions', methods=['POST'])
def search_city_attractions():
    try:
        data = request.json
        city_name = data.get('city_name')
        
        if not city_name:
            return jsonify({'error': 'City name is required'}), 400
        
        # Get city attractions using Google Places API
        attractions = get_city_attractions(city_name)
        
        if attractions:
            return jsonify({
                'attractions': attractions,
                'city': city_name,
                'count': len(attractions)
            })
        else:
            return jsonify({
                'error': f'No attractions found for "{city_name}". Please check the spelling or try a different city.',
                'attractions': [],
                'city': city_name,
                'count': 0
            }), 404
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_route_attractions', methods=['POST'])
def get_route_attractions():
    try:
        data = request.json
        origin = data.get('origin')
        destination = data.get('destination')
        distance_km = data.get('distance_km', 50)  # Default 50km
        
        if not origin or not destination:
            return jsonify({'error': 'Origin and destination are required'}), 400
        
        # Get route attractions using Google Places API
        attractions = get_attractions_along_route(origin, destination, distance_km)
        
        if attractions:
            return jsonify({
                'attractions': attractions,
                'count': len(attractions),
                'distance_filter': distance_km
            })
        else:
            return jsonify({
                'attractions': [],
                'count': 0,
                'distance_filter': distance_km,
                'message': 'No popular attractions found along this route'
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_travel_time', methods=['POST'])
def get_travel_time():
    try:
        data = request.json
        origin = data.get('origin')
        destination = data.get('destination')
        
        if not origin or not destination:
            return jsonify({'error': 'Origin and destination are required'}), 400
        
        # Get travel time for driving
        driving_time = get_directions(origin, destination, 'driving')
        
        # Get travel time for transit
        transit_time = get_directions(origin, destination, 'transit')
        
        return jsonify({
            'driving': driving_time,
            'transit': transit_time
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_nearby_places(lat, lng, radius=500000):  # 500km radius
    """Get nearby popular places using Google Places API"""
    base_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    
    params = {
        'location': f'{lat},{lng}',
        'radius': radius,
        'type': 'tourist_attraction|amusement_park|museum|park|zoo|aquarium',
        'key': GOOGLE_MAPS_API_KEY
    }
    
    try:
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if data['status'] == 'OK':
            places = []
            
            # Filter and prepare places with professional scoring
            filtered_places = []
            for place in data['results']:
                rating = place.get('rating', 0)
                user_ratings_total = place.get('user_ratings_total', 0)
                
                # Only include places with good ratings and some reviews
                if rating >= 4.0 and user_ratings_total >= 5:
                    place_info = {
                        'name': place['name'],
                        'location': place['vicinity'],
                        'rating': rating,
                        'user_ratings_total': user_ratings_total,
                        'types': place.get('types', []),
                        'photo_reference': place.get('photos', [{}])[0].get('photo_reference') if place.get('photos') else None,
                        'place_id': place.get('place_id')
                    }
                    filtered_places.append(place_info)
            
            # Professional sorting: combine rating and review count with weighted scoring
            def calculate_professional_score(place):
                rating = place['rating']
                review_count = place['user_ratings_total']
                
                # Weighted scoring system:
                # - Rating weight: 70% (rating normalized to 0-1 scale)
                # - Review count weight: 30% (logarithmic scale to prevent overwhelming by review count)
                rating_score = (rating - 1) / 4  # Normalize 1-5 rating to 0-1
                
                # Logarithmic scaling for review count (prevents places with 10k reviews from always winning)
                review_score = min(math.log10(review_count + 1) / 4, 1.0)  # Cap at 1.0
                
                # Combined weighted score
                professional_score = (rating_score * 0.7) + (review_score * 0.3)
                
                # Bonus for very high ratings with substantial reviews
                if rating >= 4.5 and review_count >= 100:
                    professional_score += 0.1
                
                return professional_score
            
            # Sort by professional score
            sorted_places = sorted(filtered_places, key=calculate_professional_score, reverse=True)
            
            # Take top 10
            places = sorted_places[:10]
            
            return places
        else:
            print(f"Places API error: {data['status']}")
            return None
    
    except Exception as e:
        print(f"Error fetching nearby places: {e}")
        return None

def get_city_attractions(city_name):
    """Get top attractions in a specific city using Google Places API"""
    # First, geocode the city to get its coordinates
    geocode_url = 'https://maps.googleapis.com/maps/api/geocode/json'
    geocode_params = {
        'address': city_name,
        'key': GOOGLE_MAPS_API_KEY
    }
    
    try:
        # Get city coordinates
        geocode_response = requests.get(geocode_url, params=geocode_params)
        geocode_data = geocode_response.json()
        
        if geocode_data['status'] != 'OK' or not geocode_data['results']:
            print(f"Geocoding failed for {city_name}: {geocode_data['status']}")
            return None
        
        # Get the first result (most relevant)
        location = geocode_data['results'][0]['geometry']['location']
        lat, lng = location['lat'], location['lng']
        
        # Search for attractions using Places API
        places_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        attractions = []
        next_page_token = None
        
        # We'll make multiple requests to get more results
        for page in range(3):  # Get up to 60 results (20 per page)
            params = {
                'location': f'{lat},{lng}',
                'radius': 50000,  # 50km radius
                'type': 'tourist_attraction',
                'key': GOOGLE_MAPS_API_KEY
            }
            
            if next_page_token:
                params['pagetoken'] = next_page_token
            
            response = requests.get(places_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                attractions.extend(data['results'])
                next_page_token = data.get('next_page_token')
                
                if not next_page_token:
                    break
                    
                # Wait for next page token to become valid
                import time
                time.sleep(2)
            else:
                break
        
        # Also search for other types of attractions
        additional_types = ['amusement_park', 'museum', 'park', 'zoo', 'aquarium', 'art_gallery', 'church', 'mosque', 'synagogue']
        
        for attraction_type in additional_types:
            params = {
                'location': f'{lat},{lng}',
                'radius': 50000,
                'type': attraction_type,
                'key': GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get(places_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                attractions.extend(data['results'])
        
        # Remove duplicates based on place_id
        unique_attractions = {}
        for place in attractions:
            place_id = place.get('place_id')
            if place_id and place_id not in unique_attractions:
                unique_attractions[place_id] = place
        
        # Filter and prepare attractions with professional scoring
        filtered_attractions = []
        for place in unique_attractions.values():
            rating = place.get('rating', 0)
            user_ratings_total = place.get('user_ratings_total', 0)
            
            # Only include places with good ratings and enough reviews
            if rating >= 4.0 and user_ratings_total >= 10:
                place_info = {
                    'name': place['name'],
                    'location': place.get('vicinity', city_name),
                    'rating': rating,
                    'user_ratings_total': user_ratings_total,
                    'types': place.get('types', []),
                    'photo_reference': place.get('photos', [{}])[0].get('photo_reference') if place.get('photos') else None,
                    'place_id': place.get('place_id')
                }
                filtered_attractions.append(place_info)
        
        # Professional sorting: combine rating and review count with weighted scoring
        def calculate_professional_score(place):
            rating = place['rating']
            review_count = place['user_ratings_total']
            
            # Weighted scoring system:
            # - Rating weight: 65% (slightly lower for city search as we want popular places)
            # - Review count weight: 35% (higher weight for city attractions)
            rating_score = (rating - 1) / 4  # Normalize 1-5 rating to 0-1
            
            # Logarithmic scaling for review count with higher emphasis for city attractions
            review_score = min(math.log10(review_count + 1) / 4.5, 1.0)  # Slightly different scaling
            
            # Combined weighted score
            professional_score = (rating_score * 0.65) + (review_score * 0.35)
            
            # Bonus for very high ratings with substantial reviews
            if rating >= 4.5 and review_count >= 500:
                professional_score += 0.15  # Higher bonus for city attractions
            elif rating >= 4.3 and review_count >= 1000:
                professional_score += 0.1   # Bonus for very popular places
            
            # Additional bonus for tourist attractions (main category)
            if 'tourist_attraction' in place.get('types', []):
                professional_score += 0.05
            
            return professional_score
        
        # Sort by professional score
        sorted_attractions = sorted(filtered_attractions, key=calculate_professional_score, reverse=True)
        
        # Return top 20
        return sorted_attractions[:20]
        
    except Exception as e:
        print(f"Error fetching city attractions for {city_name}: {e}")
        return None

def get_attractions_along_route(origin, destination, distance_km):
    """Get attractions along a travel route with route-specific scoring (40% reviews, 60% stars)"""
    try:
        # First, get the route from Google Directions API
        directions_url = 'https://maps.googleapis.com/maps/api/directions/json'
        directions_params = {
            'origin': origin,
            'destination': destination,
            'mode': 'driving',
            'key': GOOGLE_MAPS_API_KEY
        }
        
        directions_response = requests.get(directions_url, params=directions_params)
        directions_data = directions_response.json()
        
        if directions_data['status'] != 'OK' or not directions_data['routes']:
            return None
        
        # Get route polyline points
        route = directions_data['routes'][0]
        
        # Sample points along the route, excluding first and last 20%
        all_route_points = []
        total_distance = 0
        
        # First pass: collect all route points with their cumulative distances
        for leg in route['legs']:
            for step in leg['steps']:
                start_location = step['start_location']
                end_location = step['end_location']
                step_distance = step['distance']['value']  # in meters
                
                # Add start point with current distance
                all_route_points.append({
                    'lat': start_location['lat'],
                    'lng': start_location['lng'],
                    'distance': total_distance
                })
                
                # If step is long, add intermediate points
                if step_distance > 20000:  # 20km
                    # Simple interpolation for long steps
                    lat_diff = end_location['lat'] - start_location['lat']
                    lng_diff = end_location['lng'] - start_location['lng']
                    
                    num_points = int(step_distance / 20000)
                    for i in range(1, num_points):
                        ratio = i / num_points
                        inter_lat = start_location['lat'] + (lat_diff * ratio)
                        inter_lng = start_location['lng'] + (lng_diff * ratio)
                        inter_distance = total_distance + (step_distance * ratio)
                        
                        all_route_points.append({
                            'lat': inter_lat,
                            'lng': inter_lng,
                            'distance': inter_distance
                        })
                
                total_distance += step_distance
        
        # Add final destination
        final_leg = route['legs'][-1]
        final_step = final_leg['steps'][-1]
        end_location = final_step['end_location']
        all_route_points.append({
            'lat': end_location['lat'],
            'lng': end_location['lng'],
            'distance': total_distance
        })
        
        # Filter points to middle 60% of the route (exclude first and last 20%)
        start_distance = total_distance * 0.2  # 20% of total distance
        end_distance = total_distance * 0.8    # 80% of total distance
        
        route_points = []
        for point in all_route_points:
            if start_distance <= point['distance'] <= end_distance:
                route_points.append((point['lat'], point['lng']))
        
        # Search for attractions near middle route points (excluding first/last 20%)
        all_attractions = []
        distance_meters = distance_km * 1000
        
        # Limit search points to avoid too many API calls (focus on middle section)
        search_points = route_points[::max(1, len(route_points) // 8)]  # Max 8 search points from middle section
        
        for lat, lng in search_points:
            places_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
            params = {
                'location': f'{lat},{lng}',
                'radius': min(distance_meters, 50000),  # Max 50km radius per API limits
                'type': 'tourist_attraction',
                'key': GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get(places_url, params=params)
            data = response.json()
            
            if data['status'] == 'OK':
                all_attractions.extend(data['results'])
        
        # Remove duplicates based on place_id
        unique_attractions = {}
        for place in all_attractions:
            place_id = place.get('place_id')
            if place_id and place_id not in unique_attractions:
                unique_attractions[place_id] = place
        
        # Filter and score attractions with route-specific algorithm
        filtered_attractions = []
        for place in unique_attractions.values():
            rating = place.get('rating', 0)
            user_ratings_total = place.get('user_ratings_total', 0)
            
            # Route-specific filtering (slightly more lenient)
            if rating >= 3.8 and user_ratings_total >= 10:
                # Get exact coordinates from the place data
                geometry = place.get('geometry', {})
                location_coords = geometry.get('location', {})
                
                place_info = {
                    'name': place['name'],
                    'location': place.get('vicinity', 'Along route'),
                    'rating': rating,
                    'user_ratings_total': user_ratings_total,
                    'types': place.get('types', []),
                    'photo_reference': place.get('photos', [{}])[0].get('photo_reference') if place.get('photos') else None,
                    'place_id': place.get('place_id'),
                    'lat': location_coords.get('lat'),
                    'lng': location_coords.get('lng')
                }
                
                # Only include if we have valid coordinates
                if place_info['lat'] and place_info['lng']:
                    filtered_attractions.append(place_info)
        
        # Route-specific scoring: 60% stars, 40% reviews
        def calculate_route_score(place):
            rating = place['rating']
            review_count = place['user_ratings_total']
            
            # Route scoring system: 60% rating, 40% reviews
            rating_score = (rating - 1) / 4  # Normalize 1-5 rating to 0-1
            review_score = min(math.log10(review_count + 1) / 4, 1.0)
            
            # Combined weighted score (60% rating, 40% reviews)
            route_score = (rating_score * 0.6) + (review_score * 0.4)
            
            # Bonus for very high ratings
            if rating >= 4.5 and review_count >= 100:
                route_score += 0.1
            
            return route_score
        
        # Sort by route score
        sorted_attractions = sorted(filtered_attractions, key=calculate_route_score, reverse=True)
        
        # Return top 15 attractions along the route
        return sorted_attractions[:15]
        
    except Exception as e:
        print(f"Error fetching route attractions: {e}")
        return None

def get_directions(origin, destination, mode):
    """Get directions from Google Maps Directions API"""
    base_url = 'https://maps.googleapis.com/maps/api/directions/json'
    
    params = {
        'origin': origin,
        'destination': destination,
        'mode': mode,
        'key': GOOGLE_MAPS_API_KEY,
        'departure_time': 'now' if mode == 'transit' else None
    }
    
    # Remove None values
    params = {k: v for k, v in params.items() if v is not None}
    
    try:
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if data['status'] == 'OK' and data['routes']:
            route = data['routes'][0]
            leg = route['legs'][0]
            
            duration = leg['duration']['text']
            distance = leg['distance']['text']
            
            # For transit, also get departure and arrival times if available
            if mode == 'transit' and 'departure_time' in leg:
                departure_time = datetime.fromtimestamp(leg['departure_time']['value']).strftime('%H:%M')
                arrival_time = datetime.fromtimestamp(leg['arrival_time']['value']).strftime('%H:%M')
                
                return {
                    'duration': duration,
                    'distance': distance,
                    'departure_time': departure_time,
                    'arrival_time': arrival_time,
                    'status': 'success'
                }
            else:
                return {
                    'duration': duration,
                    'distance': distance,
                    'status': 'success'
                }
        else:
            return {
                'status': 'error',
                'message': f'No routes found for {mode} mode'
            }
    
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

if __name__ == '__main__':
    app.run(debug=True)
