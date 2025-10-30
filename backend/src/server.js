const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables from .env file
require("dotenv").config({ path: path.join(__dirname, '.env') });

// Verify that environment variables are properly loaded
console.log('🔍 Checking environment variables...');
console.log('WEATHER_API_KEY exists:', !!process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY !== 'YOUR_OPENWEATHER_API_KEY_HERE');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the frontend directory
app.use(cors());
app.use(express.static(path.join(__dirname, "../../frontend/src")));
app.use(express.json());

// Home routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../../frontend/src/index.html")));

// 🌤️ Weather API endpoint
app.get("/api/weather/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
    
    if (!WEATHER_API_KEY) {
      console.error("❌ Weather API key is not configured in environment variables");
      return res.status(500).json({ 
        error: "Weather API key not configured", 
        details: "Please set WEATHER_API_KEY in your environment variables" 
      });
    }

    console.log(`🔍 Attempting to fetch weather data for city: ${city}`);
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=id`
    );

    console.log(`✅ Weather API call success: ${city}`);
    res.json(response.data);
  } catch (error) {
    console.error(
      "⚠️ Weather API error:",
      error.response?.data || error.message
    );
    res
      .status(error.response?.status || 500)
      .json({ 
        error: "Failed to get weather data", 
        details: error.response?.data?.message || error.message 
      });
  }
});

// 🤖 Gemini AI endpoint (using Google Gen AI SDK with gemini-2.5-flash)
app.post("/api/gemini", async (req, res) => {
  try {
    const { message, weatherContext } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error("❌ Gemini API key is not configured in environment variables");
      return res.status(500).json({ 
        error: "Gemini API key not configured", 
        details: "Please set GEMINI_API_KEY in your environment variables" 
      });
    }

    console.log(`🤖 Received Gemini API request: ${message.substring(0, 50)}...`);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Prepare system instruction and user prompt
    let systemInstruction = "";
    let finalPrompt = message;

    if (weatherContext) {
      systemInstruction = `Kamu adalah asisten AI cuaca yang berperan menjelaskan informasi cuaca harian secara menarik, rapi, dan profesional.

Tugasmu:
- Gunakan gaya bahasa santai, friendly, dan mudah dipahami.
- Format jawaban agar rapi dengan format HTML berikut:
  - Gunakan **bold** untuk istilah penting atau highlight data utama (contoh: **Suhu: 26°C**).
  - Gunakan *italic* bila ingin menekankan kata tertentu (contoh: *agak gerah*).
  - Gunakan bullet point untuk data-data spesifik (contoh: "* **Suhu:** 25°C")
  - Pisahkan penjelasan menjadi paragraf pendek agar enak dibaca (gunakan \\n untuk baris baru).
  - Gunakan <strong>, <em>, <br>, dan <ul>/<li> untuk format yang akan dirender di browser.
- Tambahkan konteks dari data cuaca jika ada.
- Gunakan emoji ringan dan relevan (tanpa berlebihan) — misal ☀️🌧️💨🔥❄️.
- Gunakan bahasa Indonesia yang gaul tapi sopan, mirip gaya asisten AI friendly (contoh: "Santai, bro! Nih aku bantu...").
- Akhiri dengan saran atau kesimpulan singkat kalau konteksnya memungkinkan.
- Jaga supaya tetap faktual berdasarkan data cuaca, tapi bisa memberi sedikit interpretasi ringan (contoh: "kelihatannya bakal mendung lagi nih, bro").
- Jangan menjawab hal di luar topik cuaca atau permintaan pengguna.`;
      finalPrompt = `Pertanyaan pengguna: "${message}"
${weatherContext ? `\nData cuaca relevan:\n${weatherContext}` : ''}`;
    }

    // Create model with system instruction if available
    let model;
    if (systemInstruction) {
      model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction
      });
    } else {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Format the response to use HTML tags for styling
    let cleanResponse = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")  // Convert **text** to <strong>text</strong>
      .replace(/\*(.*?)\*/g, "<em>$1</em>")              // Convert *text* to <em>text</em>
      .replace(/\n\n/g, "<br><br>")                      // Convert double newlines to paragraph breaks
      .replace(/\n/g, "<br>");                           // Convert single newlines to <br> tags
    
    // Convert bullet points to HTML list format if they exist
    if (cleanResponse.includes("* ")) {
      // Convert to unordered list
      const lines = cleanResponse.split("<br>");
      let inList = false;
      let listContent = "";
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("* ")) {
          if (!inList) {
            listContent += "<ul>";
            inList = true;
          }
          const listItem = line.replace(/^\* /, "");
          listContent += `<li>${listItem}</li>`;
        } else {
          if (inList) {
            listContent += "</ul>";
            inList = false;
          }
          listContent += line;
        }
        
        // Add line break if not the last line
        if (i < lines.length - 1) {
          listContent += "<br>";
        }
      }
      
      if (inList) {
        listContent += "</ul>";
      }
      
      cleanResponse = listContent;
    }
    
    console.log("✅ Gemini API request completed successfully");
    res.json({ text: cleanResponse, model: "gemini-2.5-flash" });
  } catch (error) {
    console.error(
      "❌ Error calling Gemini API:",
      error.message
    );
    res.status(500).json({
      error: "Failed to get response from AI service",
      details: error.message,
    });
  }
});

// 🤖 Chat endpoint (for compatibility with frontend expectations)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, weatherContext, messages } = req.body;
    
    // Extract the last user message if messages array is provided
    let userMessage = message;
    if (!userMessage && messages && messages.length > 0) {
      const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
      userMessage = lastUserMessage ? lastUserMessage.content : '';
    }
    
    if (!userMessage) return res.status(400).json({ error: "Message is required" });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error("❌ Gemini API key is not configured in environment variables");
      return res.status(500).json({ 
        error: "Gemini API key not configured", 
        details: "Please set GEMINI_API_KEY in your environment variables" 
      });
    }

    console.log(`💬 Received chat API request: ${userMessage.substring(0, 50)}...`);
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Prepare system instruction and user prompt
    let systemInstruction = "";
    let finalPrompt = userMessage;

    if (weatherContext) {
      systemInstruction = `Kamu adalah asisten AI cuaca yang berperan menjelaskan informasi cuaca harian secara menarik, rapi, dan profesional.

Tugasmu:
- Gunakan gaya bahasa santai, friendly, dan mudah dipahami.
- Format jawaban agar rapi dengan format HTML berikut:
  - Gunakan **bold** untuk istilah penting atau highlight data utama (contoh: **Suhu: 26°C**).
  - Gunakan *italic* bila ingin menekankan kata tertentu (contoh: *agak gerah*).
  - Gunakan bullet point untuk data-data spesifik (contoh: "* **Suhu:** 25°C")
  - Pisahkan penjelasan menjadi paragraf pendek agar enak dibaca (gunakan \\n untuk baris baru).
  - Gunakan <strong>, <em>, <br>, dan <ul>/<li> untuk format yang akan dirender di browser.
- Tambahkan kontek dari data cuaca jika ada.
- Gunakan emoji ringan dan relevan (tanpa berlebihan) — misal ☀️🌧️💨🔥❄️.
- Gunakan bahasa Indonesia yang gaul tapi sopan, mirip gaya asisten AI friendly (contoh: "Santai, bro! Nih aku bantu...").
- Akhiri dengan saran atau kesimpulan singkat kalau konteksnya memungkinkan.
- Jaga supaya tetap faktual berdasarkan data cuaca, tapi bisa memberi sedikit interpretasi ringan (contoh: "kelihatannya bakal mendung lagi nih, bro").
- Jangan menjawab hal di luar topik cuaca atau permintaan pengguna.`;
      finalPrompt = `Pertanyaan pengguna: "${userMessage}"
${weatherContext ? `\nData cuaca relevan:\n${weatherContext}` : ''}`;
    }

    // Create model with system instruction if available
    let model;
    if (systemInstruction) {
      model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction
      });
    } else {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Format the response to use HTML tags for styling
    let cleanResponse = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")  // Convert **text** to <strong>text</strong>
      .replace(/\*(.*?)\*/g, "<em>$1</em>")              // Convert *text* to <em>text</em>
      .replace(/\n\n/g, "<br><br>")                      // Convert double newlines to paragraph breaks
      .replace(/\n/g, "<br>");                           // Convert single newlines to <br> tags
    
    // Convert bullet points to HTML list format if they exist
    if (cleanResponse.includes("* ")) {
      // Convert to unordered list
      const lines = cleanResponse.split("<br>");
      let inList = false;
      let listContent = "";
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("* ")) {
          if (!inList) {
            listContent += "<ul>";
            inList = true;
          }
          const listItem = line.replace(/^\* /, "");
          listContent += `<li>${listItem}</li>`;
        } else {
          if (inList) {
            listContent += "</ul>";
            inList = false;
          }
          listContent += line;
        }
        
        // Add line break if not the last line
        if (i < lines.length - 1) {
          listContent += "<br>";
        }
      }
      
      if (inList) {
        listContent += "</ul>";
      }
      
      cleanResponse = listContent;
    }
    
    // Save chat history to file
    const chatHistory = {
      timestamp: new Date().toISOString(),
      userMessage: userMessage,
      aiResponse: cleanResponse,
      weatherContext: weatherContext
    };
    
    // Store chat history
    await saveChatHistory(chatHistory);
    
    console.log("✅ Chat API request completed successfully");
    res.json({ 
      text: cleanResponse, 
      model: "gemini-2.5-flash",
      success: true 
    });
  } catch (error) {
    console.error(
      "❌ Error calling Chat API:",
      error.message
    );
    res.status(500).json({
      error: "Failed to get response from AI service",
      details: error.message,
      success: false
    });
  }
});

// Function to save chat history to file
const fs = require('fs');
const chatHistoryPath = path.join(__dirname, 'chat_history.json');

// Function to initialize chat history file if it doesn't exist
function initializeChatHistoryFile() {
  if (!fs.existsSync(chatHistoryPath)) {
    fs.writeFileSync(chatHistoryPath, JSON.stringify([], null, 2));
    console.log('✅ Created new chat_history.json file');
  }
}

// Initialize chat history file on startup
initializeChatHistoryFile();

// Function to save chat history to file
async function saveChatHistory(chatData) {
  try {
    let existingHistory = [];
    
    // Read existing history
    if (fs.existsSync(chatHistoryPath)) {
      const data = fs.readFileSync(chatHistoryPath, 'utf8');
      existingHistory = JSON.parse(data);
    }
    
    // Add new chat data
    existingHistory.push(chatData);
    
    // Keep only the last 100 conversations to prevent the file from growing too large
    if (existingHistory.length > 100) {
      existingHistory = existingHistory.slice(-100);
    }
    
    // Write updated history back to file
    fs.writeFileSync(chatHistoryPath, JSON.stringify(existingHistory, null, 2));
    console.log('✅ Chat history saved to file, total conversations:', existingHistory.length);
  } catch (error) {
    console.error('❌ Error saving chat history:', error.message);
  }
}

// Endpoint to get chat history
app.get("/api/chat-history", (req, res) => {
  console.log('🔍 Received request for chat history');
  try {
    if (!fs.existsSync(chatHistoryPath)) {
      console.log('⚠️ Chat history file does not exist, returning empty array');
      return res.json([]);
    }
    
    const data = fs.readFileSync(chatHistoryPath, 'utf8');
    const history = JSON.parse(data);
    console.log('✅ Returning chat history, total conversations:', history.length);
    res.json(history);
  } catch (error) {
    console.error('❌ Error reading chat history:', error.message);
    res.status(500).json({ error: "Failed to read chat history", details: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!process.env.GEMINI_API_KEY,
      weather: !!process.env.WEATHER_API_KEY,
      port: process.env.PORT || 3000
    }
  });
});

// Country API endpoint (proxy to REST Countries API)
app.get("/api/country/:name", async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`🔍 Fetching country data for: ${name}`);
    
    const response = await axios.get(`https://restcountries.com/v3.1/name/${name}`);
    
    console.log(`✅ Country API call success: ${name}`);
    res.json(response.data);
  } catch (error) {
    console.error(
      "⚠️ Country API error:",
      error.response?.data || error.message
    );
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to get country data", details: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// 404 handler
app.use((req, res) => res.status(404).send("Page not found"));

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📡 Weather Assistant API is ready!`);
  console.log(`🌍 Frontend served at http://localhost:${PORT}`);
  console.log(`🌤️ Weather API available at http://localhost:${PORT}/api/weather/:city`);
  console.log(`🤖 AI Chat API available at http://localhost:${PORT}/api/gemini`);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => console.log("✅ Server stopped gracefully."));
});