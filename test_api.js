/**
 * Test script untuk memverifikasi API keys dan integrasi backend-frontend
 * Jalankan setelah mengisi API key yang valid di file .env
 */

const axios = require('axios');

// Test environment configuration
require('dotenv').config({ path: './backend/src/.env' });

console.log('🔍 Testing API Configuration...\n');

// Check if environment variables are set correctly
const weatherApiKey = process.env.WEATHER_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

console.log('📋 Environment Variables Check:');
console.log(`WEATHER_API_KEY set: ${!!weatherApiKey && weatherApiKey !== 'YOUR_OPENWEATHER_API_KEY_HERE'}`);
console.log(`GEMINI_API_KEY set: ${!!geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY_HERE'}`);

if (!weatherApiKey || weatherApiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
    console.log('\n❌ ERROR: Weather API key belum diisi atau masih menggunakan placeholder');
    console.log('   Silakan isi WEATHER_API_KEY di file backend/src/.env dengan API key dari OpenWeatherMap');
    process.exit(1);
}

if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.log('\n❌ ERROR: Gemini API key belum diisi atau masih menggunakan placeholder');
    console.log('   Silakan isi GEMINI_API_KEY di file backend/src/.env dengan API key dari Google AI Studio');
    process.exit(1);
}

console.log('\n🚀 Testing Backend API Integration...');

// Test the backend server
async function testBackend() {
    try {
        console.log('\n1. Testing server accessibility...');
        const response = await axios.get('http://localhost:3000');
        console.log('✅ Server is accessible');
    } catch (error) {
        console.log('❌ Server not accessible. Make sure the server is running with: node backend/src/server.js');
        return;
    }

    try {
        console.log('\n2. Testing Weather API endpoint...');
        const weatherResponse = await axios.get('http://localhost:3000/api/weather/Jakarta');
        console.log('✅ Weather API is working correctly');
        console.log(`   - City: ${weatherResponse.data.name}, ${weatherResponse.data.sys.country}`);
        console.log(`   - Temperature: ${weatherResponse.data.main.temp}°C`);
        console.log(`   - Weather: ${weatherResponse.data.weather[0].description}`);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('❌ Weather API key is invalid or not properly configured');
            console.log('   Error:', error.response.data.details || error.message);
        } else {
            console.log('❌ Weather API test failed:', error.message);
        }
    }

    try {
        console.log('\n3. Testing Gemini API endpoint...');
        const geminiResponse = await axios.post('http://localhost:3000/api/gemini', {
            message: "Hai, apakah kamu berfungsi dengan baik?",
            weatherContext: ""
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (geminiResponse.data.text) {
            console.log('✅ Gemini API is working correctly');
            console.log(`   - Response preview: ${geminiResponse.data.text.substring(0, 100)}...`);
        } else {
            console.log('❌ Gemini API response format is unexpected');
        }
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('❌ Gemini API key is invalid or not properly configured');
            console.log('   Error:', error.response.data.details || error.message);
        } else {
            console.log('❌ Gemini API test failed:', error.message);
        }
    }

    console.log('\n🏁 API Integration Test Completed');
}

// Run the test
testBackend().catch(console.error);