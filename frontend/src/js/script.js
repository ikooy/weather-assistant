// API Configuration for CHAT and MAIN PAGE
const BACKEND_API_URL = "http://localhost:3000";

// DOM Elements untuk MAIN PAGE - will be assigned on DOMContentLoaded
let countryInputEl, searchBtnEl, resultSectionEl, weatherSectionEl, loadingElementEl, errorSectionEl;

// DOM Elements untuk CHAT (dari chat-ai.html)
let chatMessages, chatInput, sendBtn, typingIndicator;

// Conversation history (dari chat-ai.html)
let conversationHistory = [
  {
    role: "system",
    content: "Kamu adalah asisten AI cuaca yang ramah dan informatif",
  },
  {
    role: "assistant",
    content:
      "Halo! Saya adalah asisten AI cuaca. Tanyakan informasi cuaca di negara mana pun di dunia!",
  },
];

// ==================== FLOATING CHAT WIDGET FUNCTIONS ====================

function initChatWidget() {
  const chatWidget = document.getElementById("chatWidget");
  const chatToggle = document.getElementById("chatToggle");
  const minimizeBtn = document.getElementById("minimizeChat");
  const closeBtn = document.getElementById("closeChat");

  // Show chat widget
  chatToggle.addEventListener("click", () => {
    chatWidget.classList.remove("h-[60px]");
    chatWidget.classList.add("h-[500px]");
    chatToggle.style.display = "none";
    // Focus ke input ketika widget dibuka
    setTimeout(() => {
      if (chatInput) chatInput.focus();
    }, 100);
  });

  // Minimize chat widget
  minimizeBtn.addEventListener("click", () => {
    chatWidget.classList.toggle("minimized");
    if (chatWidget.classList.contains("minimized")) {
      chatWidget.classList.remove("h-[500px]");
      chatWidget.classList.add("h-[60px]");
      chatWidget.style.overflow = "hidden";
    } else {
      chatWidget.classList.add("h-[500px]");
      chatWidget.classList.remove("h-15");
      chatWidget.style.overflow = "visible";
    }
    chatToggle.style.display = "block";
  });

  // Close chat widget
  closeBtn.addEventListener("click", () => {
    chatWidget.classList.add("hidden");
    chatToggle.style.display = "block";
  });

  // Make chat widget draggable
  makeDraggable(chatWidget);
}

// Draggable functionality
function makeDraggable(element) {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  const header = element.querySelector(".chat-widget-header");

  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    element.style.top = element.offsetTop - pos2 + "px";
    element.style.right = "auto";
    element.style.left = element.offsetLeft - pos1 + "px";
    element.style.bottom = "auto";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

// ==================== CHAT FUNCTIONS (dari chat-ai.html) ====================

function initChatFunctionality() {
  chatMessages = document.getElementById("chatMessages");
  chatInput = document.getElementById("chatInput");
  sendBtn = document.getElementById("sendBtn");
  typingIndicator = document.getElementById("typingIndicator");

  if (!chatMessages || !chatInput || !sendBtn || !typingIndicator) {
    console.error("One or more required DOM elements not found");
    return;
  }

  // Event listeners untuk chat
  sendBtn.addEventListener("click", handleSendMessage);
  chatInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  });

  // Initial focus on input
  chatInput.focus();
}

// Fungsi 1: Tambah message ke chat
function addMessage(text, isUser = false) {
  if (!chatMessages) {
    console.error("chatMessages element not found");
    return;
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ?
    "self-end bg-primary text-white p-4 py-3.5 rounded-xl rounded-bl-md" :
    "self-start bg-white text-gray-700 p-4 py-3.5 rounded-xl rounded-br-md border border-gray-200"}`;

  // Check if text contains weather info to format it specially
  if (text.includes("Suhu:") && text.includes("Kondisi:")) {
    // Format as weather info
    messageDiv.innerHTML = `<div>${text.split("Data Cuaca")[0]
      }<br><div class="weather-info">${text.split("Data Cuaca:")[1] || text
      }</div></div>`;
  } else {
    // Use innerHTML to render HTML formatting (bold, italic, etc.)
    messageDiv.innerHTML = text;
  }

  chatMessages.appendChild(messageDiv);

  // Add to conversation history
  const role = isUser ? "user" : "assistant";
  conversationHistory.push({ role: role, content: text });

  // Keep conversation history to a reasonable size (last 10 messages + system message)
  if (conversationHistory.length > 11) {
    conversationHistory = [
      conversationHistory[0],
      ...conversationHistory.slice(-10),
    ];
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi 2: Ambil data cuaca dari OpenWeatherMap (via backend)
async function getWeatherDataForChat(city) {
  try {
    console.log(`Fetching weather data for: ${city}`);

    const response = await fetch(`${BACKEND_API_URL}/api/weather/${city}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error(`Kota "${city}" tidak ditemukan`);
      } else if (response.status === 401) {
        throw new Error(`API key cuaca tidak valid: ${errorData.message || 'Invalid API key'}`);
      } else {
        throw new Error(`Gagal mendapatkan data cuaca: ${errorData.message || response.statusText}`);
      }
    }

    const data = await response.json();
    console.log("Weather data received:", data);
    return data;
  } catch (error) {
    console.error("Error getting weather data:", error);
    throw error;
  }
}

// Fungsi 3: Deteksi pertanyaan cuaca
function isWeatherQuery(message) {
  const weatherKeywords = [
    "cuaca",
    "weather",
    "suhu",
    "hujan",
    "panas",
    "dingin",
    "angin",
    "awan",
    "berawan",
    "hujan",
    "salju",
    "kondisi langit",
    "cerah",
    "mendung",
    "badai",
    "kelembaban",
    "tekanan udara",
  ];
  const lowerMessage = message.toLowerCase();
  return weatherKeywords.some((keyword) => lowerMessage.includes(keyword));
}

// Fungsi 4: Ekstrak nama kota dari teks
function extractCityName(message) {
  // Pattern 1: "cuaca di [city]" or "weather in [city]"
  const diPattern = /(?:di|in)\s+([A-Za-z][\w\s]*?)(?:\s|$|,|\.)/i;
  const diMatch = message.match(diPattern);
  if (diMatch && diMatch[1]) {
    return diMatch[1].trim();
  }

  // Pattern 2: "[city] weather" or "[city] cuaca"
  const pattern2 = /^([A-Za-z][\w\s]*?)\s+(?:weather|cuaca|suhu|cuacanya)/i;
  const match2 = message.match(pattern2);
  if (match2 && match2[1]) {
    return match2[1].trim();
  }

  // Pattern 3: Look for capitalized words that might be city names
  const capitalPattern = /[.!?]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g;
  let capitalMatch;
  const candidates = [];
  while ((capitalMatch = capitalPattern.exec(message)) !== null) {
    candidates.push(capitalMatch[1]);
  }

  // Return the first capitalized word that's not a common word
  const commonWords = [
    "Apa",
    "Apakah",
    "Bagaimana",
    "Cuaca",
    "Suhu",
    "Hujan",
    "Angin",
    "Awan",
    "Berawan",
    "Indonesia",
    "Jakarta",
    "Bandung",
    "Surabaya",
  ];
  for (const candidate of candidates) {
    const word = candidate.trim();
    if (
      !commonWords.some((common) =>
        candidate.toLowerCase().includes(common.toLowerCase())
      )
    ) {
      return word;
    }
  }

  // If nothing else works, return the last word that seems like a potential city name
  const words = message.split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i].replace(/[.,!?]/g, "");
    if (
      word.length > 2 &&
      word[0] === word[0].toUpperCase() &&
      ![
        "cuaca",
        "weather",
        "suhu",
        "apa",
        "apakah",
        "bagaimana",
        "di",
        "in",
        "the",
        "and",
        "or",
        "for",
        "to",
        "of",
        "is",
      ].includes(word.toLowerCase())
    ) {
      return word;
    }
  }

  return null;
}

// Fungsi 5: Kirim ke Gemini AI (via backend)
async function sendToGemini(message, weatherContext = "") {
  try {
    // Try the /api/chat endpoint first (as specified in requirements)
    const response = await fetch(`${BACKEND_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        weatherContext: weatherContext,
        // Include conversation history as specified in requirements
        messages: conversationHistory
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Chat API error:", errorData);
      let errorMessage = `API error: ${response.status}`;
      if (errorData.details) {
        errorMessage += ` - ${errorData.details}`;
      } else {
        errorMessage += ` - ${JSON.stringify(errorData)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.text) {
      return data.text;
    } else if (data.success === false) {
      throw new Error(data.error || "Respons dari API tidak sesuai format yang diharapkan");
    } else {
      console.error("Unexpected API response:", data);
      throw new Error("Respons dari API tidak sesuai format yang diharapkan");
    }
  } catch (error) {
    console.error("Error calling Chat API, falling back to Gemini API:", error);
    // Fallback to /api/gemini if /api/chat fails
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          weatherContext: weatherContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Gemini API error:", errorData);
        let errorMessage = `API error: ${response.status}`;
        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`;
        } else {
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.text) {
        return data.text;
      } else {
        console.error("Unexpected API response:", data);
        throw new Error("Respons dari API tidak sesuai format yang diharapkan");
      }
    } catch (fallbackError) {
      console.error("Error calling Gemini API:", fallbackError);
      throw fallbackError;
    }
  }
}

// Format weather data untuk chat
function formatWeatherDataForChat(weatherData, city) {
  if (!weatherData) return `Tidak dapat menemukan data cuaca untuk ${city}.`;

  return `Data Cuaca untuk ${city}, ${weatherData.sys.country}:
- Suhu: ${Math.round(weatherData.main.temp)}°C (terasa seperti ${Math.round(
    weatherData.main.feels_like
  )}°C)
- Kondisi: ${weatherData.weather[0].description}
- Kelembaban: ${weatherData.main.humidity}%
- Tekanan: ${weatherData.main.pressure} hPa
- Kecepatan angin: ${weatherData.wind.speed} m/s
- Visibilitas: ${(weatherData.visibility / 1000).toFixed(1)} km`;
}

// Get weather information and format for AI
async function getWeatherForAI(message) {
  const cityName = extractCityName(message);
  if (!cityName) {
    throw new Error(
      "Maaf, saya tidak dapat mengenali nama kota dari pertanyaan Anda."
    );
  }

  const weatherData = await getWeatherDataForChat(cityName);
  return formatWeatherDataForChat(weatherData, cityName);
}

// Handle sending a message
async function handleSendMessage() {
  if (!chatInput || !chatMessages) {
    console.error("DOM elements not available");
    addMessage("Terjadi kesalahan: elemen chat tidak ditemukan", false);
    return;
  }

  const message = chatInput.value.trim();
  console.log("Message received:", message);

  if (!message) {
    console.log("Message is empty, returning");
    return;
  }

  // Add user message to chat
  addMessage(message, true);
  chatInput.value = "";

  // Show typing indicator
  showTyping();

  try {
    let aiResponse = "";

    // If it's a weather query, get weather data first
    if (isWeatherQuery(message)) {
      console.log("Weather query detected, fetching data...");
      try {
        const weatherContext = await getWeatherForAI(message);
        console.log("Weather context:", weatherContext);
        aiResponse = await sendToGemini(message, weatherContext);
      } catch (weatherError) {
        console.log(
          "Weather API failed, sending to AI without weather context:",
          weatherError.message
        );
        const fallbackMessage = `Saya tidak dapat mengambil data cuaca untuk kota tersebut karena: ${weatherError.message}. Namun, saya tetap akan mencoba membantu Anda.`;
        aiResponse = await sendToGemini(message + ". " + fallbackMessage);
      }
    } else {
      console.log("Non-weather query, sending directly to AI");
      aiResponse = await sendToGemini(message);
    }

    console.log("AI response:", aiResponse);

    if (aiResponse && aiResponse.trim().length > 0) {
      addMessage(aiResponse, false);
    } else {
      addMessage(
        "Maaf, saya tidak bisa menghasilkan jawaban saat ini. Silakan coba lagi.",
        false
      );
    }
  } catch (error) {
    console.error("Error handling message:", error);

    if (error.message.includes("not found")) {
      addMessage(
        `Maaf, ${error.message}. Silakan coba nama kota yang lain.`,
        false
      );
    } else if (error.message.includes("503 Service Unavailable") || error.message.includes("terlalu banyak")) {
      addMessage(
        "Maaf, layanan AI sedang sibuk atau tidak tersedia sementara. Silakan coba beberapa saat lagi.",
        false
      );
    } else {
      addMessage(
        `Maaf, terjadi kesalahan: ${error.message || "Tidak dapat memproses permintaan Anda saat ini."
        } Silakan coba lagi.`,
        false
      );
    }
  } finally {
    hideTyping();
  }
}

// Show typing indicator
function showTyping() {
  if (typingIndicator) {
    typingIndicator.style.display = "block";
  }
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Hide typing indicator
function hideTyping() {
  if (typingIndicator) {
    typingIndicator.style.display = "none";
  }
}

// ==================== MAIN PAGE FUNCTIONS (existing code) ====================

// Event Listeners will be added in DOMContentLoaded

// Enhanced country search with weather
async function searchCountry() {
  if (!countryInputEl) {
    console.error("countryInput element not found");
    return;
  }

  const countryName = countryInputEl.value.trim();
  if (!countryName) {
    showError("⚠️ Masukkan nama negara terlebih dahulu!");
    return;
  }

  showLoading();
  hideResult();
  hideWeather();
  hideError();

  try {
    const countryResponse = await fetch(`${BACKEND_API_URL}/api/country/${countryName}`);
    if (!countryResponse.ok) {
      const errorData = await countryResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Negara tidak ditemukan!");
    }

    const countryData = await countryResponse.json();
    const country = countryData[0];

    if (!country) {
      throw new Error("Negara tidak ditemukan!");
    }

    displayCountryInfo(country);

    if (country.capital && country.capital[0]) {
      await getWeatherData(
        country.capital[0],
        country.latlng,
        country.name.common
      );
    } else {
      await getWeatherData(
        country.name.common,
        country.latlng,
        country.name.common
      );
    }
  } catch (error) {
    showError(
      `❌ ${error.message}. Pastikan nama negara dalam bahasa Inggris dan coba lagi.`
    );
  } finally {
    hideLoading();
  }
}

// Get weather data untuk main page
async function getWeatherData(city, coordinates, countryName) {
  try {
    const weatherResponse = await fetch(`${BACKEND_API_URL}/api/weather/${city}`);
    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Data cuaca tidak tersedia");
    }

    const weatherData = await weatherResponse.json();
    displayWeatherInfo(weatherData, countryName, coordinates);
  } catch (error) {
    console.log("Weather data unavailable:", error.message);
    const weatherSection = document.getElementById("weatherSection");
    if (weatherSection) {
      // Show a message that weather data is unavailable but still display season prediction
      weatherSection.innerHTML = `
        <div class="weather-header text-center mb-8">
          <h3 class="text-3xl mb-3 text-shadow">🌤️ Cuaca Tidak Tersedia</h3>
          <p class="text-lg">Gagal mengambil data cuaca untuk ${city}</p>
        </div>
        <div class="season-prediction bg-white bg-opacity-10 p-7 rounded-xl mt-5 backdrop-blur-md">
          <div class="season-title text-center mb-6">
            <h4 class="text-2xl mb-3">🔮 Prediksi Musim di ${countryName}</h4>
            <p>Berdasarkan lokasi geografis dan data historis</p>
          </div>
        </div>
      `;
      weatherSection.style.display = "block";
      weatherSection.style.opacity = "0";
      weatherSection.style.background = "linear-gradient(135deg, #667eea, #764ba2)";
      weatherSection.style.transition = "opacity 0.5s ease-in-out";
      setTimeout(() => {
        weatherSection.style.opacity = "1";
      }, 10);
    }

    // Still try to show season prediction
    displaySeasonPrediction(coordinates, countryName);
  }
}

// Display country information
function displayCountryInfo(country) {
  if (!resultSectionEl) {
    console.error("resultSection element not found");
    return;
  }

  const currencies = country.currencies
    ? Object.values(country.currencies)
      .map((c) => `${c.name} (${c.symbol || "N/A"})`)
      .join(", ")
    : "Tidak ada data";

  const languages = country.languages
    ? Object.values(country.languages).join(", ")
    : "Tidak ada data";

  const coordinates = country.latlng ? country.latlng : [0, 0];
  const timezones = country.timezones
    ? country.timezones.slice(0, 3).join(", ")
    : "Tidak ada data";

  resultSectionEl.innerHTML = `
        <div class="flex items-center gap-5 mb-8 pb-5 border-b border-gray-200">
            <div class="text-5xl filter drop-shadow-lg">${country.flag}</div>
            <div>
                <h2 class="text-2xl text-dark mb-1">${country.name.common}</h2>
                <p class="text-gray-500 italic"><em>${country.name.official}</em></p>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">🏛️ Ibu Kota</strong>
                    <span>${country.capital ? country.capital[0] : "Tidak ada data"}</span>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">👥 Populasi</strong>
                    <span>${country.population.toLocaleString()} jiwa</span>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">🌍 Region</strong>
                    <span>${country.region}</span>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">🗺️ Subregion</strong>
                    <span>${country.subregion || "Tidak ada data"}</span>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">💰 Mata Uang</strong>
                    <span>${currencies}</span>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">🗣️ Bahasa</strong>
                    <span>${languages}</span>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">⏰ Zona Waktu</strong>
                    <span>${timezones}</span>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md border-l-4 border-primary transition-transform duration-300 hover:-translate-y-1">
                    <strong class="text-primary text-xs uppercase tracking-wider block mb-2">🚗 Sisi Mengemudi</strong>
                    <span>${country.car?.side
      ? country.car.side === "left"
        ? "Kiri"
        : "Kanan"
      : "Tidak ada data"
    }</span>
                </div>
            </div>

            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 relative overflow-hidden">
                <div class="absolute top-3 right-4 text-2xl opacity-30">📍</div>
                <strong class="text-blue-700 block mb-4 text-lg">📍 Koordinat Geografis</strong>
                <p class="font-mono bg-white bg-opacity-70 p-2 pl-3 border-l-4 border-blue-500 mb-2"><strong>Latitude:</strong> ${coordinates[0]}</p>
                <p class="font-mono bg-white bg-opacity-70 p-2 pl-3 border-l-4 border-blue-500 mb-2"><strong>Longitude:</strong> ${coordinates[1]}</p>
                <p class="text-sm"><small>Koordinat digunakan untuk menampilkan peta dan prediksi cuaca</small></p>
            </div>
        </div>

        <div class="map-section">
            <h3 class="text-2xl text-dark mb-5 flex items-center gap-3 font-medium">
                <span>🗺️</span>
                <span>Peta Lokasi ${country.name.common}</span>
            </h3>
            <div id="countryMap" class="w-full h-80 rounded-xl border border-gray-200"></div>
        </div>

        <div class="mt-8 p-5 bg-gradient-to-br from-sky-50 to-blue-100 rounded-xl border-l-4 border-blue-500">
            <strong class="text-blue-700 text-xl block mb-0">☁️ Cloud Computing Integration</strong>
            <p class="mt-4 mb-0 text-sm leading-relaxed">
                <strong>REST Countries API</strong> - Cloud Data Service (SaaS)<br>
                <strong>OpenWeatherMap API</strong> - Weather Data Service<br>
                <strong>OpenStreetMap API</strong> - Cloud Mapping Service<br>
                <strong>Real-time Integration</strong> - Multiple Cloud Platforms<br>
            </p>
        </div>
    `;

  // Add fade-in animation
  resultSectionEl.style.display = "block";
  resultSectionEl.style.opacity = "0";
  resultSectionEl.style.transition = "opacity 0.5s ease-in-out";
  setTimeout(() => {
    resultSectionEl.style.opacity = "1";
  }, 10);

  initializeMap(coordinates[0], coordinates[1], country.name.common);
}

// Display weather information
function displayWeatherInfo(weatherData, countryName, coordinates) {
  if (!weatherSectionEl) {
    console.error("weatherSection element not found");
    return;
  }

  const weatherIcon = getWeatherIcon(weatherData.weather[0].main);
  const season = predictSeason(coordinates[0], new Date().getMonth());

  weatherSectionEl.innerHTML = `
        <div class="weather-header text-center mb-8">
            <h3 class="text-3xl mb-3 text-shadow">🌤️ Informasi Cuaca di ${weatherData.name}, ${countryName}</h3>
            <p class="text-lg">Data real-time dari stasiun meteorologi</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="bg-white bg-opacity-10 p-7 rounded-xl text-center backdrop-blur-md border border-white border-opacity-20">
                <div class="text-4xl mb-4">${weatherIcon}</div>
                <div class="text-4xl font-bold my-4">${Math.round(weatherData.main.temp)}°C</div>
                <div class="text-xl mb-5">${weatherData.weather[0].description}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Terasa seperti:</span>
                        <span>${Math.round(weatherData.main.feels_like)}°C</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Kelembaban:</span>
                        <span>${weatherData.main.humidity}%</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Tekanan:</span>
                        <span>${weatherData.main.pressure} hPa</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Angin:</span>
                        <span>${weatherData.wind.speed} m/s</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-white bg-opacity-10 p-7 rounded-xl text-center backdrop-blur-md border border-white border-opacity-20">
                <div class="text-4xl mb-4">📊</div>
                <h4 class="text-xl mb-5">Detail Tambahan</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Suhu Min:</span>
                        <span>${Math.round(weatherData.main.temp_min)}°C</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Suhu Max:</span>
                        <span>${Math.round(weatherData.main.temp_max)}°C</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Visibilitas:</span>
                        <span>${(weatherData.visibility / 1000).toFixed(1)} km</span>
                    </div>
                    <div class="flex justify-between py-1.5 border-b border-white border-opacity-10">
                        <span>Awan:</span>
                        <span>${weatherData.clouds.all}%</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${displaySeasonPrediction(coordinates, countryName, season)}
    `;

  // Add fade-in animation
  weatherSectionEl.style.display = "block";
  weatherSectionEl.style.opacity = "0";
  weatherSectionEl.style.background = "linear-gradient(135deg, #667eea, #764ba2)";
  weatherSectionEl.style.transition = "opacity 0.5s ease-in-out";
      setTimeout(() => {
      weatherSectionEl.style.opacity = "1";
    }, 10);
  }
// Predict season based on latitude and month
function predictSeason(lat, month) {
  const hemisphere = lat >= 0 ? "northern" : "southern";
  const adjustedMonth = hemisphere === "southern" ? (month + 6) % 12 : month;

  if (adjustedMonth >= 2 && adjustedMonth <= 4) return "spring";
  if (adjustedMonth >= 5 && adjustedMonth <= 7) return "summer";
  if (adjustedMonth >= 8 && adjustedMonth <= 10) return "autumn";
  return "winter";
}

// Display season prediction
function displaySeasonPrediction(
  coordinates,
  countryName,
  currentSeason = null
) {
  if (!currentSeason) {
    currentSeason = predictSeason(coordinates[0], new Date().getMonth());
  }

  const seasons = [
    {
      name: "Musim Semi",
      id: "spring",
      emoji: "🌸",
      desc: "Suhu sedang, bunga bermekaran",
      gradient: "from-green-400 to-green-500",
    },
    {
      name: "Musim Panas",
      id: "summer",
      emoji: "☀️",
      desc: "Suhu panas, hari panjang",
      gradient: "from-orange-400 to-orange-500",
    },
    {
      name: "Musim Gugur",
      id: "autumn",
      emoji: "🍂",
      desc: "Suhu sejuk, daun berguguran",
      gradient: "from-red-500 to-orange-500",
    },
    {
      name: "Musim Dingin",
      id: "winter",
      emoji: "⛄",
      desc: "Suhu dingin, salju mungkin",
      gradient: "from-blue-400 to-blue-600",
    },
  ];

  const seasonPredictionHtml = `
  < div class="season-prediction bg-white bg-opacity-10 p-7 rounded-xl mt-5 backdrop-blur-md" >
            <div class="season-title text-center mb-6">
                <h4 class="text-2xl mb-3">🔮 Prediksi Musim di ${countryName}</h4>
                <p>Berdasarkan lokasi geografis dan data historis</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                ${seasons
                  .map(
                    (season) => `
                    <div class="season-card p-5 rounded-xl text-center text-white ${
                      currentSeason === season.id 
                        ? "transform scale-105 shadow-lg border-2 border-white" 
                        : ""
                    } bg-gradient-to-br ${season.gradient}">
                        <div class="text-3xl mb-2">${season.emoji}</div>
                        <div class="font-bold">${season.name}</div>
                        <div class="text-xs font-normal mt-1 opacity-80">${
                          season.desc
                        }</div>
                        ${
                          currentSeason === season.id
                            ? '<div class="mt-2 text-sm">⭐ Musim Saat Ini</div>'
                            : ""
                        }
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div >
  `;
  
  // If called from within weather section, append to that section
  // Otherwise, find the weather section and append
  if (weatherSectionEl) {
    weatherSectionEl.innerHTML += seasonPredictionHtml;
  }
  
  return seasonPredictionHtml;
}

// Get weather icon
function getWeatherIcon(weatherMain) {
  const icons = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Drizzle: "🌦️",
    Thunderstorm: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Smoke: "💨",
    Haze: "🌫️",
    Dust: "💨",
    Fog: "🌫️",
    Sand: "💨",
    Ash: "💨",
    Squall: "💨",
    Tornado: "🌪️",
  };
  return icons[weatherMain] || "🌤️";
}

// Initialize map
function initializeMap(lat, lng, countryName) {
  // Wait a bit to ensure the map container is rendered in the DOM
  setTimeout(() => {
    if (window.map) {
      try {
        window.map.remove();
      } catch (e) {
        console.log("Map was already removed or doesn't exist");
      }
    }

    const mapContainer = document.getElementById("countryMap");
    if (!mapContainer) {
      console.error("Map container element not found");
      return;
    }

    setTimeout(() => {
      try {
        window.map = L.map("countryMap").setView([lat, lng], 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(window.map);

        L.marker([lat, lng])
          .addTo(window.map)
          .bindPopup(`< b > ${ countryName }</b > <br>Lat: ${lat}, Lng: ${lng}`)
  .openPopup();

        setTimeout(() => {
          if (window.map) {
    window.map.invalidateSize();
          }
        }, 100);
      } catch (e) {
    console.error("Error initializing map:", e);
      }
    }, 100); // Additional delay to ensure DOM is fully updated
  }, 100);
}

  // UI Helper functions
  function showLoading() {
  if (loadingElementEl) loadingElementEl.style.display = "block";
  if (searchBtnEl) {
    searchBtnEl.disabled = true;
  searchBtnEl.innerHTML = "⏳ Mencari...";
  searchBtnEl.style.opacity = "0.7";
  }
}

  function hideLoading() {
  if (loadingElementEl) loadingElementEl.style.display = "none";
  if (searchBtnEl) {
    searchBtnEl.disabled = false;
  searchBtnEl.innerHTML = "🌤️ Cari Informasi & Cuaca";
  searchBtnEl.style.opacity = "1";
  }
}

  function showError(message) {
    console.log("showError called with message:", message); // Added for debugging
  if (!errorSectionEl) {
    console.error("errorSection element not found");
  return;
  }

  errorSectionEl.innerHTML = `
  <div class="text-center">
    <h3 class="text-red-700 text-xl mb-4">❌ Oops! Terjadi Kesalahan</h3>
    <p class="mb-3 text-lg">${message}</p>
    <p class="text-gray-500 text-sm">💡 Tips: Gunakan nama negara dalam bahasa Inggris (contoh: "indonesia", "japan")</p>
  </div>
  `;
  // Add fade-in animation
  errorSectionEl.style.display = "block";
  errorSectionEl.style.opacity = "0";
  errorSectionEl.style.transition = "opacity 0.5s ease-in-out";
  setTimeout(() => {
    errorSectionEl.style.opacity = "1";
  }, 10);
}

  function hideError() {
  if (!errorSectionEl) return;

  errorSectionEl.style.opacity = "0";
  setTimeout(() => {
    errorSectionEl.style.display = "none";
  }, 300); // Match the transition duration
}

  function hideResult() {
  if (!resultSectionEl) return;

  resultSectionEl.style.opacity = "0";
  setTimeout(() => {
    resultSectionEl.style.display = "none";
  }, 300); // Match the transition duration
}

  function hideWeather() {
  if (!weatherSectionEl) return;

  weatherSectionEl.style.opacity = "0";
  setTimeout(() => {
    weatherSectionEl.style.display = "none";
  }, 300); // Match the transition duration
}

  // ==================== INITIALIZE EVERYTHING ====================

  // Initialize page
  document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements untuk MAIN PAGE (ambil lagi setelah DOM selesai load)
    countryInputEl = document.getElementById("countryInput");
  searchBtnEl = document.getElementById("searchBtn");
  resultSectionEl = document.getElementById("result");
  weatherSectionEl = document.getElementById("weatherSection");
  loadingElementEl = document.getElementById("loading");
  errorSectionEl = document.getElementById("error");

  // Initialize main page functionality
  const cloudCards = document.querySelectorAll(".cloud-card");
  cloudCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });

  if (countryInputEl) {
    countryInputEl.focus();

  const sampleCountries = ["Indonesia", "Japan", "Brazil", "Germany", "Canada"];
  const randomCountry =
  sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
  countryInputEl.placeholder = `Ketik nama negara (contoh: ${randomCountry.toLowerCase()})...`;
  }

  // Event Listeners untuk main page
  if (searchBtnEl) {
    searchBtnEl.addEventListener("click", searchCountry);
  }

  if (countryInputEl) {
    countryInputEl.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        searchCountry();
      }
    });
  }

  // Initialize chat functionality
  initChatWidget();
  initChatFunctionality();
});

  console.log(`
  🌍 World Explorer - Cloud Computing UTS
  📍 Integrated with REST Countries API
  🌤️ Integrated with Weather Data
  🗺️ Multiple Cloud Services Implementation
  🔮 Seasonal Prediction Feature
  💬 Floating Chat Widget Activated
  `);
