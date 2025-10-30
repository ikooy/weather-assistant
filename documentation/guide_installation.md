# Weather Assistant - Installation Guide

This guide explains how to set up and run the Weather Assistant project on your local machine.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- npm (usually comes with Node.js)

## Installation Steps

### 1. Clone or Download the Project
```bash
git clone <repository-url>
# or download and extract the project files
```

### 2. Navigate to Project Directory
```bash
cd weather-assistant
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Configuration
- Create a `.env` file in the `backend/src/` directory based on the `.env copy` file
- Add your API keys for:
  - Weather API (OpenWeatherMap)
  - Google Generative AI (Gemini)

Example `.env` file content:
```
WEATHER_API_KEY=your_openweathermap_api_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### 5. Run the Application
```bash
# Using npm
npm start

# Or directly with node
node backend/src/server.js
```

### 6. Access the Application
Open your browser and navigate to: `http://localhost:3000`

## Project Structure
```
weather-assistant/
├── frontend/
│   └── src/
│       ├── index.html
│       ├── style.css
│       └── script.js
├── backend/
│   └── src/
│       ├── server.js
│       └── .env
├── documentation/
│   └── guide_installation.md
└── package.json
```

## Troubleshooting

- If you encounter permission errors, make sure you have the correct file permissions
- If the server won't start, verify that your `.env` file is properly configured
- Make sure port 3000 is not being used by another application

## API Endpoints

- `GET /` - Main application page
- `GET /api/weather/:city` - Get weather data for a city
- `POST /api/gemini` - Communicate with the AI assistant