// API Configuration untuk MAIN PAGE
const COUNTRIES_API = "https://restcountries.com/v3.1";
const WEATHER_API_KEY = "9f5da2646c399356922ecd13e8493f0b";
const WEATHER_API = "https://api.openweathermap.org/data/2.5";

// API Configuration untuk CHAT (dari chat-ai.html)
const BACKEND_API_URL = "http://localhost:3000";

// DOM Elements untuk MAIN PAGE
const countryInput = document.getElementById("countryInput");
const searchBtn = document.getElementById("searchBtn");
const resultSection = document.getElementById("result");
const weatherSection = document.getElementById("weatherSection");
const loadingElement = document.getElementById("loading");
const errorSection = document.getElementById("error");

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
    chatWidget.classList.remove("hidden");
    chatToggle.style.display = "none";
    // Focus ke input ketika widget dibuka
    setTimeout(() => {
      if (chatInput) chatInput.focus();
    }, 100);
  });

  // Minimize chat widget
  minimizeBtn.addEventListener("click", () => {
    chatWidget.classList.add("minimized");
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
  messageDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;

  // Check if text contains weather info to format it specially
  if (text.includes("Suhu:") && text.includes("Kondisi:")) {
    // Format as weather info
    messageDiv.innerHTML = `<div>${
      text.split("Data Cuaca")[0]
    }<br><div class="weather-info">${
      text.split("Data Cuaca:")[1] || text
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

    const response = await fetch(
      `${WEATHER_API}?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=id`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Kota "${city}" tidak ditemukan`);
      } else if (response.status === 401) {
        throw new Error("API key cuaca tidak valid");
      } else {
        throw new Error(`Gagal mendapatkan data cuaca: ${response.status}`);
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
      throw new Error(
        `API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    if (data.text) {
      return data.text;
    } else {
      console.error("Unexpected API response:", data);
      throw new Error("Respons dari API tidak sesuai format yang diharapkan");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
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
    } else if (error.message.includes("terlalu banyak")) {
      addMessage(
        "Maaf, saat ini server sedang sibuk. Silakan coba beberapa saat lagi.",
        false
      );
    } else {
      addMessage(
        `Maaf, terjadi kesalahan: ${
          error.message || "Tidak dapat memproses permintaan Anda saat ini."
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

// Event Listeners untuk main page
searchBtn.addEventListener("click", searchCountry);
countryInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    searchCountry();
  }
});

// Enhanced country search with weather
async function searchCountry() {
  const countryName = countryInput.value.trim();
  if (!countryName) {
    showError("⚠️ Masukkan nama negara terlebih dahulu!");
    return;
  }

  showLoading();
  hideResult();
  hideWeather();
  hideError();

  try {
    const countryResponse = await fetch(`${COUNTRIES_API}/name/${countryName}`);
    if (!countryResponse.ok) {
      throw new Error("Negara tidak ditemukan!");
    }

    const countryData = await countryResponse.json();
    const country = countryData[0];

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
    const weatherResponse = await fetch(`/api/weather/${city}`);
    if (!weatherResponse.ok) {
      throw new Error("Data cuaca tidak tersedia");
    }

    const weatherData = await weatherResponse.json();
    displayWeatherInfo(weatherData, countryName, coordinates);
  } catch (error) {
    console.log("Weather data unavailable:", error);
    displaySeasonPrediction(coordinates, countryName);
  }
}

// Display country information
function displayCountryInfo(country) {
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

  resultSection.innerHTML = `
        <div class="country-header">
            <div class="country-flag">${country.flag}</div>
            <div class="country-name">
                <h2>${country.name.common}</h2>
                <p><em>${country.name.official}</em></p>
            </div>
        </div>

        <div class="enhanced-layout">
            <div class="country-details">
                <div class="detail-item">
                    <strong>🏛️ Ibu Kota</strong>
                    <span>${
                      country.capital ? country.capital[0] : "Tidak ada data"
                    }</span>
                </div>
                <div class="detail-item">
                    <strong>👥 Populasi</strong>
                    <span>${country.population.toLocaleString()} jiwa</span>
                </div>
                <div class="detail-item">
                    <strong>🌍 Region</strong>
                    <span>${country.region}</span>
                </div>
                <div class="detail-item">
                    <strong>🗺️ Subregion</strong>
                    <span>${country.subregion || "Tidak ada data"}</span>
                </div>
                <div class="detail-item">
                    <strong>💰 Mata Uang</strong>
                    <span>${currencies}</span>
                </div>
                <div class="detail-item">
                    <strong>🗣️ Bahasa</strong>
                    <span>${languages}</span>
                </div>
                <div class="detail-item">
                    <strong>⏰ Zona Waktu</strong>
                    <span>${timezones}</span>
                </div>
                <div class="detail-item">
                    <strong>🚗 Sisi Mengemudi</strong>
                    <span>${
                      country.car?.side
                        ? country.car.side === "left"
                          ? "Kiri"
                          : "Kanan"
                        : "Tidak ada data"
                    }</span>
                </div>
            </div>

            <div class="coordinates">
                <strong>📍 Koordinat Geografis</strong>
                <p><strong>Latitude:</strong> ${coordinates[0]}</p>
                <p><strong>Longitude:</strong> ${coordinates[1]}</p>
                <p><small>Koordinat digunakan untuk menampilkan peta dan prediksi cuaca</small></p>
            </div>
        </div>

        <div class="map-section">
            <h3>🗺️ Peta Lokasi ${country.name.common}</h3>
            <div id="countryMap"></div>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #e8f4fd, #bbdefb); border-radius: 12px; border-left: 4px solid #2196F3;">
            <strong style="color: #1976D2; font-size: 1.1em;">☁️ Cloud Computing Integration</strong>
            <p style="margin: 15px 0 0 0; font-size: 0.95em; line-height: 1.6;">
                <strong>REST Countries API</strong> - Cloud Data Service (SaaS)<br>
                <strong>OpenWeatherMap API</strong> - Weather Data Service<br>
                <strong>OpenStreetMap API</strong> - Cloud Mapping Service<br>
                <strong>Real-time Integration</strong> - Multiple Cloud Platforms<br>
            </p>
        </div>
    `;

  initializeMap(coordinates[0], coordinates[1], country.name.common);
  resultSection.style.display = "block";
}

// Display weather information
function displayWeatherInfo(weatherData, countryName, coordinates) {
  const weatherIcon = getWeatherIcon(weatherData.weather[0].main);
  const season = predictSeason(coordinates[0], new Date().getMonth());

  weatherSection.innerHTML = `
        <div class="weather-header">
            <h3>🌤️ Informasi Cuaca di ${weatherData.name}, ${countryName}</h3>
            <p>Data real-time dari stasiun meteorologi</p>
        </div>
        
        <div class="weather-grid">
            <div class="weather-card">
                <div class="weather-icon">${weatherIcon}</div>
                <div class="weather-temp">${Math.round(
                  weatherData.main.temp
                )}°C</div>
                <div class="weather-desc">${
                  weatherData.weather[0].description
                }</div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <span>Terasa seperti:</span>
                        <span>${Math.round(
                          weatherData.main.feels_like
                        )}°C</span>
                    </div>
                    <div class="weather-detail">
                        <span>Kelembaban:</span>
                        <span>${weatherData.main.humidity}%</span>
                    </div>
                    <div class="weather-detail">
                        <span>Tekanan:</span>
                        <span>${weatherData.main.pressure} hPa</span>
                    </div>
                    <div class="weather-detail">
                        <span>Angin:</span>
                        <span>${weatherData.wind.speed} m/s</span>
                    </div>
                </div>
            </div>
            
            <div class="weather-card">
                <div class="weather-icon">📊</div>
                <h4>Detail Tambahan</h4>
                <div class="weather-details">
                    <div class="weather-detail">
                        <span>Suhu Min:</span>
                        <span>${Math.round(weatherData.main.temp_min)}°C</span>
                    </div>
                    <div class="weather-detail">
                        <span>Suhu Max:</span>
                        <span>${Math.round(weatherData.main.temp_max)}°C</span>
                    </div>
                    <div class="weather-detail">
                        <span>Visibilitas:</span>
                        <span>${(weatherData.visibility / 1000).toFixed(
                          1
                        )} km</span>
                    </div>
                    <div class="weather-detail">
                        <span>Awan:</span>
                        <span>${weatherData.clouds.all}%</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${displaySeasonPrediction(coordinates, countryName, season)}
    `;

  weatherSection.style.display = "block";
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
    },
    {
      name: "Musim Panas",
      id: "summer",
      emoji: "☀️",
      desc: "Suhu panas, hari panjang",
    },
    {
      name: "Musim Gugur",
      id: "autumn",
      emoji: "🍂",
      desc: "Suhu sejuk, daun berguguran",
    },
    {
      name: "Musim Dingin",
      id: "winter",
      emoji: "⛄",
      desc: "Suhu dingin, salju mungkin",
    },
  ];

  return `
        <div class="season-prediction">
            <div class="season-title">
                <h4>🔮 Prediksi Musim di ${countryName}</h4>
                <p>Berdasarkan lokasi geografis dan data historis</p>
            </div>
            <div class="seasons-grid">
                ${seasons
                  .map(
                    (season) => `
                    <div class="season-card ${season.id} ${
                      currentSeason === season.id ? "current-season" : ""
                    }">
                        <div style="font-size: 2em;">${season.emoji}</div>
                        <div>${season.name}</div>
                        <div style="font-size: 0.8em; font-weight: normal; margin-top: 5px;">${
                          season.desc
                        }</div>
                        ${
                          currentSeason === season.id
                            ? '<div style="margin-top: 5px;">⭐ Musim Saat Ini</div>'
                            : ""
                        }
                    </div>
                `
                  )
                  .join("")}
            </div>
        </div>
    `;
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
  if (window.map) {
    window.map.remove();
  }

  const mapContainer = document.getElementById("countryMap");
  mapContainer.innerHTML = "";

  setTimeout(() => {
    window.map = L.map("countryMap").setView([lat, lng], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(window.map);

    L.marker([lat, lng])
      .addTo(window.map)
      .bindPopup(`<b>${countryName}</b><br>Lat: ${lat}, Lng: ${lng}`)
      .openPopup();

    setTimeout(() => {
      window.map.invalidateSize();
    }, 100);
  }, 50);
}

// UI Helper functions
function showLoading() {
  loadingElement.style.display = "block";
  searchBtn.disabled = true;
  searchBtn.innerHTML = "⏳ Mencari...";
  searchBtn.style.opacity = "0.7";
}

function hideLoading() {
  loadingElement.style.display = "none";
  searchBtn.disabled = false;
  searchBtn.innerHTML = "🌤️ Cari Informasi & Cuaca";
  searchBtn.style.opacity = "1";
}

function showError(message) {
  errorSection.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #d32f2f; margin-bottom: 15px;">❌ Oops! Terjadi Kesalahan</h3>
            <p style="margin-bottom: 10px; font-size: 1.1em;">${message}</p>
            <p style="color: #666; font-size: 0.9em;">💡 Tips: Gunakan nama negara dalam bahasa Inggris (contoh: "indonesia", "japan")</p>
        </div>
    `;
  errorSection.style.display = "block";
}

function hideError() {
  errorSection.style.display = "none";
}

function hideResult() {
  resultSection.style.display = "none";
}

function hideWeather() {
  weatherSection.style.display = "none";
}

// ==================== INITIALIZE EVERYTHING ====================

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Initialize main page functionality
  const cloudCards = document.querySelectorAll(".cloud-card");
  cloudCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });

  countryInput.focus();

  const sampleCountries = ["Indonesia", "Japan", "Brazil", "Germany", "Canada"];
  const randomCountry =
    sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
  countryInput.placeholder = `Ketik nama negara (contoh: ${randomCountry.toLowerCase()})...`;

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
