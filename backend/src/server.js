const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

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

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=id`
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error calling Weather API:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({ error: "Failed to get weather data", details: error.message });
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
    
    res.json({ text: cleanResponse, model: "gemini-2.5-flash" });
  } catch (error) {
    console.error(
      "❌ Error calling Gemini API:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to get response from AI service",
      details: error.message,
    });
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