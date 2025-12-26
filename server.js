const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// Home routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/chat", (req, res) =>
  res.sendFile(path.join(__dirname, "chat-ai.html"))
);

// 🌤️ Weather API endpoint
app.get("/api/weather/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const WEATHER_API_KEY =
      process.env.WEATHER_API_KEY || "9f5da2646c399356922ecd13e8493f0b";

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

// 🤖 Gemini AI endpoint - DIPERBAIKI UNTUK GREETING
app.post("/api/gemini", async (req, res) => {
  try {
    const { message, weatherContext } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const GEMINI_API_KEY =
      process.env.GEMINI_API_KEY || "AIzaSyAv7EhBNHVi3JtASjeraQ0vWZmRbVomnNM";

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // BUAT TANGGAL REAL-TIME YANG SELALU UPDATE
    const now = new Date();
    const currentDate = now.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const currentTime = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // BUAT TANGGAL BESOK UNTUK REFERENSI
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowDate = tomorrow.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // PERBAIKAN: System instruction yang lebih fleksibel
    let systemInstruction = "";
    let finalPrompt = message;

    // Deteksi apakah ini greeting
    const isGreeting = /^(halo|hello|hai|hi|selamat)/i.test(message);

    if (weatherContext) {
      systemInstruction = `Kamu adalah asisten AI cuaca yang BERFOKUS PADA INFORMASI CUACA SAJA.

INFORMASI WAKTU REAL-TIME:
- Tanggal saat ini: ${currentDate}
- Jam saat ini: ${currentTime}
- Tanggal besok: ${tomorrowDate}

ATURAN KETAT:
1. UTAMAKAN pertanyaan tentang cuaca, iklim, musim, atau informasi geografis
2. Untuk salam/greeting (halo, hai, selamat pagi), BOLEH jawab dengan sopan dan arahkan ke topik cuaca
3. Untuk pertanyaan tanggal/waktu, BOLEH jawab dengan informasi real-time di atas
4. JANGAN jawab pertanyaan di luar topik cuaca seperti curhat, kehidupan pribadi, dll
5. Jika ditanya tanggal/jam, SELALU gunakan informasi waktu real-time di atas
6. Untuk prediksi cuaca, hanya berikan informasi maksimal 7 hari ke depan
7. Gunakan data cuaca yang diberikan sebagai sumber utama
8. Jika ditanya "hari ini", gunakan tanggal: ${currentDate}
9. Jika ditanya "besok", gunakan tanggal: ${tomorrowDate}
10. Tolak dengan sopan pertanyaan di luar topik cuaca

CONTOH RESPON GREETING:
- "Halo! Saya asisten AI cuaca. Ada yang bisa saya bantu mengenai cuaca atau iklim?"
- "Selamat pagi! Siap membantu informasi cuaca hari ini."

FORMAT JAWABAN:
- Gunakan bahasa Indonesia yang ramah tapi profesional
- Berikan data faktual dari sumber cuaca
- Untuk pertanyaan tanggal/waktu, berikan informasi real-time
- Jangan berikan prediksi untuk lebih dari 1 minggu
- Jika tidak ada data cuaca, katakan dengan jujur
- Gunakan format HTML untuk styling (<strong>, <em>, <br>, <ul>/<li>)

DATA CUACA YANG TERSEDIA:
${weatherContext}`;

      finalPrompt = `Pertanyaan pengguna: "${message}"
${weatherContext ? `\nData cuaca relevan:\n${weatherContext}` : ""}`;
    } else {
      systemInstruction = `Kamu adalah asisten AI cuaca yang khusus membantu informasi cuaca dan iklim.

INFORMASI WAKTU REAL-TIME:
- Tanggal saat ini: ${currentDate}
- Jam saat ini: ${currentTime}
- Tanggal besok: ${tomorrowDate}

ATURAN:
- UTAMAKAN pertanyaan tentang cuaca, musim, iklim, atau informasi geografis
- Untuk salam/greeting (halo, hai, selamat pagi), BOLEH jawab dengan sopan dan arahkan ke topik cuaca
- Untuk pertanyaan tanggal/waktu, BOLEH jawab dengan informasi real-time di atas
- Tolak dengan sopan pertanyaan di luar topik tersebut  
- SELALU gunakan informasi waktu real-time di atas ketika ditanya tentang tanggal/waktu
- Jika ditanya "hari ini", referensikan: ${currentDate}
- Jika ditanya "besok", referensikan: ${tomorrowDate}
- Untuk prediksi cuaca, batasi maksimal 7 hari ke depan
- Berikan informasi yang faktual dan akurat
- Gunakan bahasa Indonesia yang jelas dan mudah dipahami

CONTOH RESPON GREETING:
- "Halo! Saya asisten AI cuaca. Ada yang bisa saya bantu mengenai cuaca hari ini?"
- "Selamat siang! Saya siap membantu dengan informasi cuaca dan iklim."`;
    }

    // Create model with system instruction
    let model;
    if (systemInstruction) {
      model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
      });
    } else {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    // Format the response to use HTML tags for styling
    let cleanResponse = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>");

    // Convert bullet points to HTML list format if they exist
    if (cleanResponse.includes("* ")) {
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
  console.log(`📡 Ready to use Gemini 2.5 Flash model via SDK`);
  console.log(`⏰ System time configured for real-time responses`);
  console.log(`👋 Greeting responses enabled`);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => console.log("✅ Server stopped gracefully."));
});
