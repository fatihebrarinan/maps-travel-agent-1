#!/usr/bin/env python3
"""
Demo script to run the Travel Time Estimator application
"""
import os
import sys

def main():
    print("🗺️  Travel Time Estimator Demo")
    print("=" * 50)
    
    # Check if API key is set
    api_key = os.getenv('GOOGLE_MAPS_API_KEY')
    if not api_key:
        print("❌ Google Maps API key not found!")
        print("\n📋 Setup Instructions:")
        print("1. Get your API key from Google Cloud Console")
        print("2. Enable these APIs:")
        print("   - Maps JavaScript API")
        print("   - Directions API") 
        print("   - Places API")
        print("   - Geocoding API")
        print("\n3. Set your API key:")
        print("   Windows: set GOOGLE_MAPS_API_KEY=your_key_here")
        print("   Mac/Linux: export GOOGLE_MAPS_API_KEY=your_key_here")
        print("\n4. Run this script again")
        return
    
    print(f"✅ API key found: {api_key[:10]}...")
    
    # Import and run the app
    try:
        from app import app
        print("\n🚀 Starting the application...")
        print("📍 Open your browser to: http://localhost:5000")
        print("\n🎯 Features available:")
        print("   • Location-based travel recommendations")
        print("   • Interactive Google Maps")
        print("   • Driving and transit time calculations")
        print("   • Beautiful responsive design")
        print("\n⌨️  Press Ctrl+C to stop the server")
        print("-" * 50)
        
        app.run(debug=True, host='0.0.0.0', port=5000)
        
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("💡 Install them with: pip install -r requirements.txt")
    except KeyboardInterrupt:
        print("\n\n👋 Thanks for using Travel Time Estimator!")

if __name__ == "__main__":
    main()
