let map;
let directionsService;
let directionsRenderer;
let originAutocomplete;
let destinationAutocomplete;
let userLocation = null;
let routeAttractionMarkers = [];
let hoverInfoWindow = null;
// Get API key from global variable
const GOOGLE_MAPS_API_KEY = window.GOOGLE_MAPS_API_KEY;

// Initialize the map
function initMap() {
    // Default to New York City
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: defaultLocation,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        panel: null
    });
    directionsRenderer.setMap(map);

    // Initialize autocomplete for origin and destination
    initAutocomplete();

    // Add event listeners
    document.getElementById('calculate-btn').addEventListener('click', calculateTravelTime);
    document.getElementById('reset-btn').addEventListener('click', resetCalculator);

    // Allow Enter key to trigger calculation
    document.getElementById('origin').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') calculateTravelTime();
    });

    document.getElementById('destination').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') calculateTravelTime();
    });

    // Tab navigation
    document.getElementById('recommendations-tab').addEventListener('click', () => switchTab('recommendations'));
    document.getElementById('city-search-tab').addEventListener('click', () => switchTab('city-search'));
    document.getElementById('calculator-tab').addEventListener('click', () => switchTab('calculator'));

    // City search functionality
    document.getElementById('search-city-btn').addEventListener('click', searchCityAttractions);
    document.getElementById('city-search-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') searchCityAttractions();
    });

    // Try to get user's current location and load recommendations
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);

                // Add marker for current location
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "Your Location",
                    icon: {
                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    }
                });

                // Load recommendations based on user location
                loadRecommendations(userLocation.lat, userLocation.lng);
            },
            function () {
                console.log("Geolocation service failed or denied");
                // Load famous locations as fallback
                loadRecommendations();
            }
        );
    } else {
        // Load famous locations as fallback
        loadRecommendations();
    }
}

function initAutocomplete() {
    // Create autocomplete objects for both input fields
    originAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('origin'),
        { types: ['geocode'] }
    );

    destinationAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('destination'),
        { types: ['geocode'] }
    );

    // Bias the autocomplete to the map's viewport
    originAutocomplete.bindTo('bounds', map);
    destinationAutocomplete.bindTo('bounds', map);
}

async function calculateTravelTime() {
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();

    if (!origin || !destination) {
        showError('Please enter both origin and destination');
        return;
    }

    // Show loading state
    showLoading();
    hideError();
    hideResults();

    try {
        // Make request to Flask backend
        const response = await fetch('/get_travel_time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: origin,
                destination: destination
            })
        });

        const data = await response.json();

        if (response.ok) {
            displayResults(data);

            // Also show route on map for driving
            showRouteOnMap(origin, destination);

            // Show route options
            showRouteOptions();
        } else {
            showError(data.error || 'Failed to calculate travel time');
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('results');

    // Display driving results
    if (data.driving && data.driving.status === 'success') {
        document.getElementById('driving-time').textContent = data.driving.duration;
        document.getElementById('driving-distance').textContent = data.driving.distance;
    } else {
        document.getElementById('driving-time').textContent = 'N/A';
        document.getElementById('driving-distance').textContent = data.driving?.message || 'No route found';
    }

    // Display transit results
    if (data.transit && data.transit.status === 'success') {
        document.getElementById('transit-time').textContent = data.transit.duration;
        document.getElementById('transit-distance').textContent = data.transit.distance;

        // Show departure/arrival times if available
        if (data.transit.departure_time && data.transit.arrival_time) {
            document.getElementById('departure-time').textContent = data.transit.departure_time;
            document.getElementById('arrival-time').textContent = data.transit.arrival_time;
            document.getElementById('transit-schedule').style.display = 'block';
        } else {
            document.getElementById('transit-schedule').style.display = 'none';
        }
    } else {
        document.getElementById('transit-time').textContent = 'N/A';
        document.getElementById('transit-distance').textContent = data.transit?.message || 'No transit route found';
        document.getElementById('transit-schedule').style.display = 'none';
    }

    resultsContainer.style.display = 'flex';
}

function showRouteOnMap(origin, destination) {
    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function (result, status) {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
        } else {
            console.error('Directions request failed due to ' + status);
        }
    });
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function hideResults() {
    document.getElementById('results').style.display = 'none';
}

// Add some utility functions for better UX
function clearRoute() {
    directionsRenderer.setDirections({ routes: [] });
}

// Function to swap origin and destination
function swapLocations() {
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');

    const temp = originInput.value;
    originInput.value = destinationInput.value;
    destinationInput.value = temp;
}

// Add keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + Enter to calculate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        calculateTravelTime();
    }

    // Ctrl/Cmd + S to swap locations
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        swapLocations();
    }
});

// Handle map clicks to set origin/destination
let clickMode = null; // 'origin' or 'destination'

function setClickMode(mode) {
    clickMode = mode;
    map.setOptions({ cursor: 'crosshair' });
}

// Add click listener to map
google.maps.event.addListener(map, 'click', function (event) {
    if (clickMode) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: event.latLng }, function (results, status) {
            if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;

                if (clickMode === 'origin') {
                    document.getElementById('origin').value = address;
                } else if (clickMode === 'destination') {
                    document.getElementById('destination').value = address;
                }

                // Reset cursor and click mode
                map.setOptions({ cursor: 'default' });
                clickMode = null;
            }
        });
    }
});

// Tab switching functionality
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Update sections
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(`${tabName}-section`).classList.add('active');

    // Trigger map resize when switching to calculator tab
    if (tabName === 'calculator') {
        setTimeout(() => {
            if (map) {
                google.maps.event.trigger(map, 'resize');
                // Re-center the map
                if (userLocation) {
                    map.setCenter(userLocation);
                } else {
                    map.setCenter({ lat: 40.7128, lng: -74.0060 });
                }
            }
        }, 100);
    }
}

// Load recommendations
async function loadRecommendations(lat = null, lng = null) {
    const loadingElement = document.getElementById('recommendations-loading');
    const subtitleElement = document.getElementById('recommendations-subtitle');
    const containerElement = document.getElementById('recommendations-container');

    // Show loading
    loadingElement.style.display = 'flex';
    containerElement.innerHTML = '';

    if (lat && lng) {
        subtitleElement.textContent = 'Discovering amazing places near you...';
    } else {
        subtitleElement.textContent = 'Here are some famous destinations to explore...';
    }

    try {
        const response = await fetch('/get_recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lat: lat,
                lng: lng
            })
        });

        const data = await response.json();

        if (response.ok) {
            displayRecommendations(data.recommendations, data.source);

            if (data.source === 'nearby') {
                subtitleElement.textContent = 'Top-rated places within 500km of your location';
            } else {
                subtitleElement.textContent = 'Famous destinations around the world';
            }
        } else {
            showRecommendationError(data.error || 'Failed to load recommendations');
        }
    } catch (error) {
        showRecommendationError('Network error: ' + error.message);
    } finally {
        loadingElement.style.display = 'none';
    }
}

// Display recommendations
function displayRecommendations(recommendations, source) {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = '';

    recommendations.forEach((place, index) => {
        const card = createRecommendationCard(place, index);
        container.appendChild(card);
    });
}

// Create recommendation card
function createRecommendationCard(place, index) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const imageIcon = getPlaceIcon(place.types);
    const stars = generateStars(place.rating);
    const types = place.types.slice(0, 3).map(type =>
        type.replace(/_/g, ' ').replace('establishment', 'place')
    ).filter(type => type !== 'place');

    // Format review count for display
    const reviewCount = place.user_ratings_total || 0;
    const reviewText = reviewCount > 0 ? `(${formatReviewCount(reviewCount)} reviews)` : '';

    card.innerHTML = `
        <div class="recommendation-image ${place.photo_reference ? 'has-photo' : ''}" 
             ${place.photo_reference ? `style="background-image: url('https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photo_reference}&key=${GOOGLE_MAPS_API_KEY}')"` : ''}>
            ${!place.photo_reference ? `<i class="fas ${imageIcon}"></i>` : ''}
        </div>
        <div class="recommendation-content">
            <h3 class="recommendation-title">${place.name}</h3>
            <div class="recommendation-location">
                <i class="fas fa-map-marker-alt"></i>
                ${place.location}
            </div>
            <div class="recommendation-rating">
                <div class="stars">${stars}</div>
                <span class="rating-number">${place.rating.toFixed(1)}</span>
                ${reviewText ? `<span class="review-count">${reviewText}</span>` : ''}
            </div>
            ${types.length > 0 ? `
                <div class="recommendation-types">
                    ${types.map(type => `<span class="type-tag">${type}</span>`).join('')}
                </div>
            ` : ''}
            <button class="calculate-travel-btn" onclick="calculateTravelToPlace('${place.location.replace(/'/g, "\\'")}')">
                <i class="fas fa-route"></i> Calculate Travel Time
            </button>
        </div>
    `;

    return card;
}

// Generate star rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star star"></i>';
    }

    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt star"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star star empty"></i>';
    }

    return stars;
}

// Get appropriate icon for place type
function getPlaceIcon(types) {
    const iconMap = {
        'tourist_attraction': 'fa-camera',
        'amusement_park': 'fa-ferris-wheel',
        'museum': 'fa-university',
        'park': 'fa-tree',
        'zoo': 'fa-paw',
        'aquarium': 'fa-fish',
        'art_gallery': 'fa-palette',
        'church': 'fa-church',
        'mosque': 'fa-mosque',
        'synagogue': 'fa-star-of-david',
        'stadium': 'fa-futbol',
        'shopping_mall': 'fa-shopping-bag',
        'restaurant': 'fa-utensils',
        'lodging': 'fa-bed'
    };

    for (const type of types) {
        if (iconMap[type]) {
            return iconMap[type];
        }
    }

    return 'fa-map-marker-alt';
}

// Calculate travel time to a specific place
function calculateTravelToPlace(destination) {
    // Switch to calculator tab
    switchTab('calculator');

    // Set destination
    document.getElementById('destination').value = destination;

    // Set origin to user location or prompt user
    if (userLocation) {
        // Use reverse geocoding to get address from coordinates
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: userLocation }, function (results, status) {
            if (status === 'OK' && results[0]) {
                document.getElementById('origin').value = results[0].formatted_address;
                // Auto-calculate
                calculateTravelTime();
            } else {
                document.getElementById('origin').focus();
            }
        });
    } else {
        // Focus on origin input for user to enter
        document.getElementById('origin').focus();
    }
}

// Show recommendation error
function showRecommendationError(message) {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: white;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.7;"></i>
            <h3 style="margin-bottom: 10px;">Unable to Load Recommendations</h3>
            <p style="opacity: 0.8;">${message}</p>
        </div>
    `;
}

// City search functionality
async function searchCityAttractions() {
    const cityInput = document.getElementById('city-search-input');
    const cityName = cityInput.value.trim();

    if (!cityName) {
        showCitySearchError('Please enter a city name');
        return;
    }

    // Show loading state
    showCitySearchLoading();
    hideCitySearchError();
    clearCitySearchResults();

    try {
        const response = await fetch('/search_city_attractions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                city_name: cityName
            })
        });

        const data = await response.json();

        if (response.ok && data.attractions && data.attractions.length > 0) {
            displayCityAttractions(data.attractions, data.city);
        } else {
            showCitySearchError(data.error || `No attractions found for "${cityName}". Please try a different city.`);
        }
    } catch (error) {
        showCitySearchError('Network error: ' + error.message);
    } finally {
        hideCitySearchLoading();
    }
}

// Display city attractions
function displayCityAttractions(attractions, cityName) {
    const resultsContainer = document.getElementById('city-search-results');
    resultsContainer.innerHTML = `
        <div class="city-results-header">
            <h3 style="color: white; text-align: center; margin-bottom: 30px; font-size: 1.5rem;">
                <i class="fas fa-star" style="color: #ffd700; margin-right: 10px;"></i>
                Top Attractions in ${cityName}
                <span style="font-size: 0.9rem; opacity: 0.8; display: block; margin-top: 5px;">
                    Found ${attractions.length} highly-rated places
                </span>
            </h3>
        </div>
        <div class="recommendations-grid">
            ${attractions.map((attraction, index) => createAttractionCard(attraction, index)).join('')}
        </div>
    `;
}

// Create attraction card (similar to recommendation card but with some differences)
function createAttractionCard(attraction, index) {
    const imageIcon = getPlaceIcon(attraction.types);
    const stars = generateStars(attraction.rating);
    const types = attraction.types.slice(0, 3).map(type =>
        type.replace(/_/g, ' ').replace('establishment', 'place')
    ).filter(type => type !== 'place');

    return `
        <div class="recommendation-card" style="animation-delay: ${index * 0.1}s;">
            <div class="recommendation-image ${attraction.photo_reference ? 'has-photo' : ''}" 
                 ${attraction.photo_reference ? `style="background-image: url('https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${attraction.photo_reference}&key=${GOOGLE_MAPS_API_KEY}')"` : ''}>
                ${!attraction.photo_reference ? `<i class="fas ${imageIcon}"></i>` : ''}
            </div>
            <div class="recommendation-content">
                <h3 class="recommendation-title">${attraction.name}</h3>
                <div class="recommendation-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${attraction.location}
                </div>
                <div class="recommendation-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-number">${attraction.rating.toFixed(1)}</span>
                    <span class="review-count">
                        (${formatReviewCount(attraction.user_ratings_total)} reviews)
                    </span>
                </div>
                ${types.length > 0 ? `
                    <div class="recommendation-types">
                        ${types.map(type => `<span class="type-tag">${type}</span>`).join('')}
                    </div>
                ` : ''}
                <button class="calculate-travel-btn" onclick="calculateTravelToPlace('${attraction.location.replace(/'/g, "\\'")}')">
                    <i class="fas fa-route"></i> Calculate Travel Time
                </button>
            </div>
        </div>
    `;
}

// City search UI functions
function showCitySearchLoading() {
    document.getElementById('city-search-loading').style.display = 'flex';
}

function hideCitySearchLoading() {
    document.getElementById('city-search-loading').style.display = 'none';
}

function showCitySearchError(message) {
    const errorElement = document.getElementById('city-search-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideCitySearchError() {
    document.getElementById('city-search-error').style.display = 'none';
}

function clearCitySearchResults() {
    const resultsContainer = document.getElementById('city-search-results');
    resultsContainer.innerHTML = `
        <div class="search-placeholder">
            <i class="fas fa-spinner fa-spin search-placeholder-icon"></i>
            <h3>Searching...</h3>
            <p>Finding the best attractions in your chosen city.</p>
        </div>
    `;
}

// Format review count for better readability
function formatReviewCount(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    } else {
        return count.toString();
    }
}

// Show route options section
function showRouteOptions() {
    document.getElementById('route-options').style.display = 'block';

    // Add event listener for find attractions button
    const findAttractionsBtn = document.getElementById('find-attractions-btn');
    findAttractionsBtn.addEventListener('click', function () {
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        if (origin && destination) {
            loadRouteAttractionsOnMap(origin, destination);
        }
    });
}

// Load attractions along the route and show on map
async function loadRouteAttractionsOnMap(origin, destination) {
    const distanceKm = parseInt(document.getElementById('attraction-distance').value) || 50;

    // Clear existing attraction markers
    clearRouteAttractionMarkers();

    // Show loading state on button
    const findBtn = document.getElementById('find-attractions-btn');
    const originalText = findBtn.innerHTML;
    findBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding attractions...';
    findBtn.disabled = true;

    try {
        const response = await fetch('/get_route_attractions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: origin,
                destination: destination,
                distance_km: distanceKm
            })
        });

        const data = await response.json();

        if (response.ok && data.attractions && data.attractions.length > 0) {
            displayRouteAttractionsOnMap(data.attractions);
            showSuccess(`Found ${data.attractions.length} attractions in the middle section of your route`);
        } else {
            showError(data.message || 'No attractions found along this route');
        }
    } catch (error) {
        showError('Error loading route attractions: ' + error.message);
    } finally {
        // Restore button
        findBtn.innerHTML = originalText;
        findBtn.disabled = false;
    }
}

// Display route attractions on map as markers
function displayRouteAttractionsOnMap(attractions) {
    attractions.forEach((attraction, index) => {
        // Use exact coordinates from the attraction data
        if (attraction.lat && attraction.lng) {
            addAttractionMarker(attraction, index);
        } else {
            // Fallback to geocoding if coordinates not available
            geocodeAttraction(attraction, index);
        }
    });
}

// Add attraction marker using exact coordinates
function addAttractionMarker(attraction, index) {
    const position = { lat: attraction.lat, lng: attraction.lng };

    // Create marker for attraction
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        title: attraction.name,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
        }
    });

    // Create info window content
    const stars = generateStars(attraction.rating);
    const reviewCount = formatReviewCount(attraction.user_ratings_total);

    const infoContent = `
        <div class="map-info-window">
            <div class="info-header">
                <h4>${attraction.name}</h4>
                <div class="info-rating">
                    <div class="stars">${stars}</div>
                    <span>${attraction.rating.toFixed(1)} (${reviewCount})</span>
                </div>
            </div>
            <div class="info-location">
                <i class="fas fa-map-marker-alt"></i> ${attraction.location}
            </div>
            <div class="info-actions">
                <button onclick="calculateTravelToPlace('${attraction.location.replace(/'/g, "\\'")}'); google.maps.event.trigger(map, 'click');" class="info-directions-btn">
                    <i class="fas fa-route"></i> Get Directions
                </button>
            </div>
        </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
        content: infoContent
    });

    // Create hover content (more compact than click info window)
    const hoverContent = createHoverContent(attraction);

    // Add hover listeners
    marker.addListener('mouseover', function () {
        // Close any existing hover window
        if (hoverInfoWindow) {
            hoverInfoWindow.close();
        }

        // Create new hover info window
        hoverInfoWindow = new google.maps.InfoWindow({
            content: hoverContent,
            disableAutoPan: true,
            pixelOffset: new google.maps.Size(0, -10)
        });

        hoverInfoWindow.open(map, marker);
    });

    marker.addListener('mouseout', function () {
        if (hoverInfoWindow) {
            hoverInfoWindow.close();
        }
    });

    // Add click listener to marker
    marker.addListener('click', function () {
        // Close hover window when clicking
        if (hoverInfoWindow) {
            hoverInfoWindow.close();
        }

        // Close other click info windows
        routeAttractionMarkers.forEach(m => {
            if (m.infoWindow) m.infoWindow.close();
        });
        infoWindow.open(map, marker);
    });

    // Store marker and info window
    marker.infoWindow = infoWindow;
    routeAttractionMarkers.push(marker);
}

// Geocode attraction and add marker to map (fallback)
function geocodeAttraction(attraction, index) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: attraction.location }, function (results, status) {
        if (status === 'OK' && results[0]) {
            // Update attraction with geocoded coordinates
            attraction.lat = results[0].geometry.location.lat();
            attraction.lng = results[0].geometry.location.lng();
            addAttractionMarker(attraction, index);
        }
    });
}

// Clear route attraction markers
function clearRouteAttractionMarkers() {
    // Close hover window if open
    if (hoverInfoWindow) {
        hoverInfoWindow.close();
        hoverInfoWindow = null;
    }

    routeAttractionMarkers.forEach(marker => {
        if (marker.infoWindow) {
            marker.infoWindow.close();
        }
        marker.setMap(null);
    });
    routeAttractionMarkers = [];
}

// Show success message
function showSuccess(message) {
    // You can implement a success message display here if needed
    console.log('Success:', message);
}

// Reset calculator function
function resetCalculator() {
    // Clear input fields
    document.getElementById('origin').value = '';
    document.getElementById('destination').value = '';

    // Clear results
    document.getElementById('results').style.display = 'none';
    document.getElementById('driving-time').textContent = '--';
    document.getElementById('driving-distance').textContent = '--';
    document.getElementById('transit-time').textContent = '--';
    document.getElementById('transit-distance').textContent = '--';

    // Hide route options
    document.getElementById('route-options').style.display = 'none';

    // Clear directions from map
    directionsRenderer.setDirections({ routes: [] });

    // Clear route attraction markers
    clearRouteAttractionMarkers();

    // Close hover window if open
    if (hoverInfoWindow) {
        hoverInfoWindow.close();
        hoverInfoWindow = null;
    }

    // Reset attraction distance input
    document.getElementById('attraction-distance').value = '50';

    // Re-center map to default location or user location
    if (userLocation) {
        map.setCenter(userLocation);
        map.setZoom(13);
    } else {
        map.setCenter({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
        map.setZoom(13);
    }
}

// Create hover content for map markers
function createHoverContent(attraction) {
    const stars = generateStars(attraction.rating);
    const reviewCount = formatReviewCount(attraction.user_ratings_total);

    // Create image element if photo reference exists
    let imageHtml = '';
    if (attraction.photo_reference && GOOGLE_MAPS_API_KEY) {
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photo_reference=${attraction.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`;
        imageHtml = `
            <div class="hover-image">
                <img src="${imageUrl}" alt="${attraction.name}" loading="lazy">
            </div>
        `;
    } else {
        // Fallback icon if no image
        const iconClass = getPlaceIcon(attraction.types);
        imageHtml = `
            <div class="hover-image-placeholder">
                <i class="fas ${iconClass}"></i>
            </div>
        `;
    }

    return `
        <div class="map-hover-tooltip">
            ${imageHtml}
            <div class="hover-content">
                <h4 class="hover-title">${attraction.name}</h4>
                <div class="hover-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-text">${attraction.rating.toFixed(1)}</span>
                </div>
                <div class="hover-reviews">
                    <i class="fas fa-users"></i> ${reviewCount} reviews
                </div>
                <div class="hover-location">
                    <i class="fas fa-map-marker-alt"></i> ${attraction.location}
                </div>
                <div class="hover-tip">
                    <small>Click for directions</small>
                </div>
            </div>
        </div>
    `;
}
