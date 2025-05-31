import React, { useState } from 'react';
import axios from 'axios';

function FlightPricePredictor() {
  // State to hold form inputs
  const [formData, setFormData] = useState({
    airline: '',
    source_city: '',
    departure_time: '',
    stops: '',
    arrival_time: '',
    destination_city: '',
    class: '',
    departure_date: '',
  });

  // State to hold prediction result
  const [prediction, setPrediction] = useState(null);
  // Loading state for async submit
  const [loading, setLoading] = useState(false);
  // Error state
  const [error, setError] = useState('');

  // Time sequence validation
  const validateTimeSequence = (departure, arrival) => {
    const timeOrder = {
      'Early_Morning': 0,
      'Morning': 1,
      'Afternoon': 2,
      'Evening': 3,
      'Night': 4,
      'Late_Night': 5
    };

    // Special cases for same time slots
    if (departure === arrival) {
      // Allow same time slots only for specific combinations
      const validSameTimeRoutes = [
        { source: 'Delhi', destination: 'Mumbai' },
        { source: 'Mumbai', destination: 'Delhi' },
        { source: 'Delhi', destination: 'Kolkata' },
        { source: 'Kolkata', destination: 'Delhi' },
        { source: 'Mumbai', destination: 'Bangalore' },
        { source: 'Bangalore', destination: 'Mumbai' }
      ];

      const isSameTimeRoute = validSameTimeRoutes.some(
        route => route.source === formData.source_city && route.destination === formData.destination_city
      );

      if (!isSameTimeRoute) {
        return {
          isValid: false,
          message: 'Arrival time cannot be the same as departure time for this route'
        };
      }
    }

    // Check for minimum flight duration
    const minDurationRoutes = {
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
    };

    const routeKey = `${formData.source_city}-${formData.destination_city}`;
    const minDuration = minDurationRoutes[routeKey] || 1; // Default minimum duration is 1 hour

    // Calculate time difference
    const timeDiff = timeOrder[arrival] - timeOrder[departure];
    if (timeDiff < 0) {
      timeDiff += 6; // Add 6 to handle overnight flights
    }

    // Convert time slots to hours (each slot is approximately 4 hours)
    const durationInHours = timeDiff * 4;

    if (durationInHours < minDuration) {
      return {
        isValid: false,
        message: `Flight duration must be at least ${minDuration} hours for this route`
      };
    }

    return {
      isValid: true,
      message: ''
    };
  };

  // Date validation
  const validateDate = (date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6); // Allow booking up to 6 months in advance

    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return 'Departure date cannot be in the past';
    }
    if (selectedDate > maxDate) {
      return 'Departure date cannot be more than 6 months in advance';
    }
    return null;
  };

  // Handle input/select change and update state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user changes any field
    setError('');

    // Validate time sequence when both departure and arrival times are selected
    if ((name === 'departure_time' || name === 'arrival_time') && 
        formData.departure_time && formData.arrival_time) {
      const timeValidation = validateTimeSequence(formData.departure_time, formData.arrival_time);
      if (!timeValidation.isValid) {
        setError(timeValidation.message);
      }
    }

    // Validate date when selected
    if (name === 'departure_date' && value) {
      const dateError = validateDate(value);
      if (dateError) {
        setError(dateError);
      }
    }
  };

  // Submit form data to backend and get prediction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setPrediction(null);

    // Validate source and destination cities
    if (formData.source_city === formData.destination_city) {
      setError('Source and destination cities cannot be the same');
      setLoading(false);
      return;
    }

    // Validate time sequence
    const timeValidation = validateTimeSequence(formData.departure_time, formData.arrival_time);
    if (!timeValidation.isValid) {
      setError(timeValidation.message);
      setLoading(false);
      return;
    }

    // Validate date
    const dateError = validateDate(formData.departure_date);
    if (dateError) {
      setError(dateError);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', formData);
      setPrediction(response.data.prediction);
    } catch (error) {
      console.error('Error fetching prediction:', error);
      setError(error.response?.data?.error || 'An error occurred while predicting the price');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-sky-100 via-blue-200 to-sky-300 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-4">
        <h1 className="text-5xl font-bold text-blue-800 mb-8 text-center">
          Flight Price Predictor
        </h1>
       
        {error && (
          <div className="mb-4 p-4 bg-red-100/90 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 shadow-xl rounded-2xl p-6"
        >
          <div className="grid grid-cols-8 gap-4">
            {/* Airline */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Airline</label>
              <select
                name="airline"
                value={formData.airline}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select</option>
                <option value="SpiceJet">SpiceJet</option>
                <option value="AirAsia">AirAsia</option>
                <option value="Vistara">Vistara</option>
                <option value="GO_FIRST">GO_FIRST</option>
                <option value="Indigo">Indigo</option>
                <option value="Air_India">Air India</option>
              </select>
            </div>

            {/* Source City */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Source City</label>
              <select
                name="source_city"
                value={formData.source_city}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            {/* Departure Time */}
            <div className="space-y-1 col-span-2">
              <label className="block text-base font-medium text-gray-700">Departure Time</label>
              <select
                name="departure_time"
                value={formData.departure_time}
                onChange={handleChange}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                required
              >
                <option value="">Select</option>
                <option value="Evening">Evening</option>
                <option value="Early_Morning">Early Morning</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
                <option value="Late_Night">Late Night</option>
              </select>
            </div>

            {/* Stops */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Stops</label>
              <select
                name="stops"
                value={formData.stops}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select</option>
                <option value="zero">Zero</option>
                <option value="one">One</option>
                <option value="two_or_more">Two or More</option>
              </select>
            </div>

            {/* Arrival Time */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
              <select
                name="arrival_time"
                value={formData.arrival_time}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select</option>
                <option value="Night">Night</option>
                <option value="Morning">Morning</option>
                <option value="Early_Morning">Early Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Late_Night">Late Night</option>
              </select>
            </div>

            {/* Destination City */}
            <div className="space-y-1 col-span-2">
              <label className="block text-base font-medium text-gray-700">Destination City</label>
              <select
                name="destination_city"
                value={formData.destination_city}
                onChange={handleChange}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                required
              >
                <option value="">Select</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            {/* Class */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <select
                name="class"
                value={formData.class}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select</option>
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
              </select>
            </div>

            {/* Departure Date */}
            <div className="space-y-1 col-span-2">
              <label className="block text-base font-medium text-gray-700">Departure Date</label>
              <input
                type="date"
                name="departure_date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.departure_date}
                onChange={handleChange}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Predicting...' : 'Predict'}
            </button>
          </div>
        </form>

        {prediction !== null && (
          <div className="mt-4 p-4 bg-green-100/90 rounded-lg text-green-700 text-center">
            <h2 className="text-xl font-semibold">Your Flight Price: ₹{prediction}</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default FlightPricePredictor;
