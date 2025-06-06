# Import necessary libraries
from flask import Flask, request, jsonify  # For creating the web app and handling requests
import pickle  # To load the saved machine learning model
from datetime import datetime, timedelta  # To work with dates (like calculating days left)
from flask_cors import CORS  # To allow React frontend to connect to Flask backend
import numpy as np

# Create a Flask web app
app = Flask(__name__)
CORS(app)  # Allow frontend (React) to connect to backend (Flask)

# Load the trained model from the file
model = pickle.load(open('model.pkl', 'rb'))

# Dictionaries to convert text input into numbers (like 'AirAsia' to 0)
airline_dict = {'AirAsia': 0, 'Indigo': 1, 'GO_FIRST': 2, 'SpiceJet': 3, 'Air_India': 4, 'Vistara': 5}
source_dict = {'Delhi': 0, 'Hyderabad': 1, 'Bangalore': 2, 'Mumbai': 3, 'Kolkata': 4, 'Chennai': 5}
departure_dict = {'Early_Morning': 0, 'Morning': 1, 'Afternoon': 2, 'Evening': 3, 'Night': 4, 'Late_Night': 5}
stops_dict = {'zero': 0, 'one': 1, 'two_or_more': 2}
arrival_dict = {'Early_Morning': 0, 'Morning': 1, 'Afternoon': 2, 'Evening': 3, 'Night': 4, 'Late_Night': 5}
destination_dict = {'Delhi': 0, 'Hyderabad': 1, 'Mumbai': 2, 'Bangalore': 3, 'Chennai': 4, 'Kolkata': 5}
class_dict = {'Economy': 0, 'Business': 1}

# Define valid airline routes
valid_routes = {
    'AirAsia': ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai'],
    'Indigo': ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai'],
    'GO_FIRST': ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai'],
    'SpiceJet': ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai'],
    'Air_India': ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai'],
    'Vistara': ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Hyderabad', 'Chennai']
}

def validate_time_sequence(departure_time, arrival_time, source_city, destination_city):
    """Validate that arrival time is after departure time and meets minimum duration requirements"""
    time_order = {
        'Early_Morning': 0,
        'Morning': 1,
        'Afternoon': 2,
        'Evening': 3,
        'Night': 4,
        'Late_Night': 5
    }

    # Special cases for same time slots
    if departure_time == arrival_time:
        # Allow same time slots only for specific combinations
        valid_same_time_routes = [
            ('Delhi', 'Mumbai'),
            ('Mumbai', 'Delhi'),
            ('Delhi', 'Kolkata'),
            ('Kolkata', 'Delhi'),
            ('Mumbai', 'Bangalore'),
            ('Bangalore', 'Mumbai')
        ]
        
        if (source_city, destination_city) not in valid_same_time_routes:
            return False, 'Arrival time cannot be the same as departure time for this route'

    # Check for minimum flight duration
    min_duration_routes = {
        'Delhi-Mumbai': 2,
        'Mumbai-Delhi': 2,
        'Delhi-Bangalore': 2.5,
        'Bangalore-Delhi': 2.5,
        'Mumbai-Bangalore': 1.5,
        'Bangalore-Mumbai': 1.5,
        'Delhi-Kolkata': 2,
        'Kolkata-Delhi': 2,
        'Delhi-Chennai': 2.5,
        'Chennai-Delhi': 2.5,
        'Mumbai-Kolkata': 2.5,
        'Kolkata-Mumbai': 2.5
    }

    route_key = f"{source_city}-{destination_city}"
    min_duration = min_duration_routes.get(route_key, 1)  # Default minimum duration is 1 hour

    # Calculate time difference
    time_diff = time_order[arrival_time] - time_order[departure_time]
    if time_diff < 0:
        time_diff += 6  # Add 6 to handle overnight flights

    # Convert time slots to hours (each slot is approximately 4 hours)
    duration_in_hours = time_diff * 4

    if duration_in_hours < min_duration:
        return False, f'Flight duration must be at least {min_duration} hours for this route'

    return True, ''

def validate_route(airline, source, destination):
    """Validate if the airline operates on the given route"""
    if airline not in valid_routes:
        return False
    return source in valid_routes[airline] and destination in valid_routes[airline]

def validate_input(data):
    """Validate input data and return error message if any"""
    # Check if source and destination are same
    if data['source_city'] == data['destination_city']:
        return 'Source and destination cities cannot be the same'
    
    # Check if departure date is valid
    try:
        departure_date = datetime.strptime(data['departure_date'], '%Y-%m-%d')
        today = datetime.today()
        max_date = today + timedelta(days=180)  # 6 months in advance
        
        if departure_date.date() < today.date():
            return 'Departure date cannot be in the past'
        if departure_date.date() > max_date.date():
            return 'Departure date cannot be more than 6 months in advance'
    except ValueError:
        return 'Invalid departure date format'
    
    # Validate time sequence
    is_valid, time_error = validate_time_sequence(
        data['departure_time'],
        data['arrival_time'],
        data['source_city'],
        data['destination_city']
    )
    if not is_valid:
        return time_error
    
    # Validate route
    if not validate_route(data['airline'], data['source_city'], data['destination_city']):
        return f"{data['airline']} does not operate on the route {data['source_city']} to {data['destination_city']}"
    
    # Check if all required fields are present
    required_fields = ['airline', 'source_city', 'departure_time', 'stops', 
                      'arrival_time', 'destination_city', 'class', 'departure_date']
    for field in required_fields:
        if field not in data or not data[field]:
            return f'Missing required field: {field}'
    
    return None

# Define a route '/predict' that only accepts POST requests
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the data sent from the frontend (React)
        data = request.json

        # Validate input data
        error_message = validate_input(data)
        if error_message:
            return jsonify({'error': error_message}), 400

        # Convert text values into numbers using the dictionaries
        airline = airline_dict[data['airline']]
        source_city = source_dict[data['source_city']]
        departure_time = departure_dict[data['departure_time']]
        stops = stops_dict[data['stops']]
        arrival_time = arrival_dict[data['arrival_time']]
        destination_city = destination_dict[data['destination_city']]
        travel_class = class_dict[data['class']]

        # Convert departure date from string to date format
        departure_date = datetime.strptime(data['departure_date'], '%Y-%m-%d')

        # Calculate how many days are left from today to the departure date
        date_diff = (departure_date - datetime.today()).days + 1

        # Create a list of features in the same order used in model training
        features = [airline, source_city, departure_time, stops, arrival_time, destination_city, travel_class, date_diff]

        # Use the model to predict the price
        prediction = model.predict([features])[0]

        # Return the predicted price as JSON
        return jsonify({'prediction': round(prediction, 2)})

    # If any other error occurs, return that error
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Start the Flask server when you run this file
if __name__ == '__main__':
    app.run(debug=True)
