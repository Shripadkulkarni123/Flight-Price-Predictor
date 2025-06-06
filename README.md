# Flight Price Predictor

This project is a full-stack application that predicts flight prices based on various parameters like airline, route, time, and class. It consists of a Flask backend for the prediction model and a React frontend for the user interface.

## Project Structure

```
├── app.py                 # Flask backend application
├── model.pkl             # Trained machine learning model
├── Clean_Dataset.csv     # Dataset used for training
├── flight-frontend/      # React frontend application
└── Flight.ipynb          # Jupyter notebook for model training
```

## Prerequisites

- Python 3.7 or higher
- Node.js 14 or higher
- npm or yarn package manager

## Installation

### Backend Setup

1. Create a Python virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install flask flask-cors numpy scikit-learn
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd flight-frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend Server

1. Make sure you're in the root directory of the project
2. Run the Flask application:
```bash
python app.py
```
The backend server will start on `http://localhost:5000`

### Start the Frontend Development Server

1. Open a new terminal
2. Navigate to the frontend directory:
```bash
cd flight-frontend
```
3. Start the development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

## Features

- Flight price prediction based on:
  - Airline selection
  - Source and destination cities
  - Departure and arrival times
  - Number of stops
  - Travel class
  - Departure date
- Input validation for realistic flight routes
- Real-time price predictions
- Modern and responsive user interface

## Supported Airlines

- AirAsia
- Indigo
- GO_FIRST
- SpiceJet
- Air India
- Vistara

## Supported Cities

- Delhi
- Mumbai
- Bangalore
- Kolkata
- Hyderabad
- Chennai

## Note

The prediction model is trained on historical data and provides estimates based on various factors. Actual prices may vary based on market conditions and airline policies. 