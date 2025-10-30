// API Configuration for CHAT and MAIN PAGE
const BACKEND_API_URL = "http://localhost:3000";

// DOM Elements untuk MAIN PAGE - will be assigned on DOMContentLoaded
let countryInputEl, searchBtnEl, resultSectionEl, weatherSectionEl, loadingElementEl, errorSectionEl;

// DOM Elements untuk CHAT (dari chat-ai.html)
let chatMessages, chatInput, sendBtn, typingIndicator;

// Variables to store last chat widget position
// (Removed since the new widget has fixed positioning)

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
  const closeBtn = document.getElementById("closeChat");
  const minimizeBtn = document.getElementById("minimizeChat");
  const chatWidgetHeader = chatWidget.querySelector(".chat-widget-header");

  // Show chat widget
  chatToggle.addEventListener("click", () => {
    chatWidget.classList.remove("hidden"); // Make the chat widget visible
    chatToggle.style.display = "none"; // Hide the toggle button

    // Focus ke input ketika widget dibuka
    setTimeout(() => {
      if (chatInput) chatInput.focus();
    }, 100);
  });

  // Close chat widget
  closeBtn.addEventListener("click", () => {
    chatWidget.classList.add("hidden"); // Hide the chat widget completely
    chatToggle.style.display = "block"; // Show the toggle button again
  });

  // Minimize chat widget (for now just hide it, can be expanded later)
  if(minimizeBtn) {
    minimizeBtn.addEventListener("click", () => {
      chatWidget.classList.toggle("minimized");
    });
  }

  // Close chat widget when clicking outside if it's open
  document.addEventListener("click", (event) => {
    if (!chatWidget.contains(event.target) && 
        !chatToggle.contains(event.target) &&
        chatWidget.classList.contains("hidden") === false) {
      // Don't close if clicking on other interactive elements
    }
  });

  // Add event listeners for quick action buttons
  const quickActionBtns = document.querySelectorAll('.quick-action-btn');
  quickActionBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      handleQuickAction(action);
    });
  });
}

// Handle quick weather actions
function handleQuickAction(action) {
  switch(action) {
    case 'today-weather':
      addMessage("Bagaimana cuaca hari ini di kota Anda?", true);
      setTimeout(() => {
        showTyping();
        setTimeout(() => {
          hideTyping();
          addMessage("Untuk mengetahui cuaca hari ini, silakan sebutkan nama kota yang ingin Anda ketahui cuacanya! 🌤️ Misalnya: Jakarta, Bali, atau kota lainnya.");
        }, 1500);
      }, 500);
      break;
    case 'forecast':
      addMessage("Ramalan cuaca", true);
      setTimeout(() => {
        showTyping();
        setTimeout(() => {
          hideTyping();
          addMessage("Saya dapat membantu Anda dengan ramalan cuaca! Silakan sebutkan nama kota yang ingin Anda ketahui ramalan cuacanya. 📅 Saya bisa memberikan informasi cuaca untuk beberapa hari ke depan.");
        }, 1500);
      }, 500);
      break;
    default:
      break;
  }
}

// ==================== CHAT FUNCTIONS (dari chat-ai.html) ====================



const CHAT_HISTORY_KEY = 'weatherAssistantChatHistory';



// Function to save chat history to localStorage

function saveChatHistory() {

  try {

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(conversationHistory));

  } catch (e) {

    console.error("Error saving chat history to localStorage:", e);

  }

}



// Function to load chat history from localStorage

function loadChatHistory() {

  try {

    const storedHistory = localStorage.getItem(CHAT_HISTORY_KEY);

    if (storedHistory) {

      const parsedHistory = JSON.parse(storedHistory);

      // Replace initial conversationHistory with loaded one

      conversationHistory = parsedHistory;

      // Display loaded messages

      chatMessages.innerHTML = ''; // Clear initial messages

      conversationHistory.forEach(msg => {

        if (msg.role !== "system") { // Don't display system message

          // Use a temporary flag to prevent re-saving during load

          addMessage(msg.content, msg.role === "user", true);

        }

      });

      chatMessages.scrollTop = chatMessages.scrollHeight;

    }

  } catch (e) {

    console.error("Error loading chat history from localStorage:", e);

    // If loading fails, reset to initial conversationHistory

    conversationHistory = [

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

  }

}



function initChatFunctionality() {

  chatMessages = document.getElementById("chatMessages");
  chatInput = document.getElementById("chatInput");
  sendBtn = document.getElementById("sendBtn");
  typingIndicator = document.getElementById("typingIndicator");

  if (!chatMessages || !chatInput || !sendBtn || !typingIndicator) {
    console.error("One or more required DOM elements not found");
    return;
  }

  // Load chat history from backend API when chat functionality initializes
  loadChatHistoryFromAPI();

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



// Function to load chat history from backend API
async function loadChatHistoryFromAPI() {
  console.log("🔍 Loading chat history from backend API...");
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/chat-history`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.status} ${response.statusText}`);
    }
    const history = await response.json();
    console.log(`✅ Loaded ${history.length} chat conversations from backend`);
    
    if (Array.isArray(history) && history.length > 0) {
      // Clear the chat messages container
      chatMessages.innerHTML = '';
      
      // Add initial AI message
      const initialMessage = document.createElement("div");
      initialMessage.className = "message ai-message";
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      initialMessage.innerHTML = `
        <div class="message-content">Halo! Saya adalah asisten AI cuaca. Tanyakan informasi cuaca di negara mana pun di dunia!</div>
        <span class="timestamp">${timestamp}</span>
      `;
      chatMessages.appendChild(initialMessage);
      
      // Add previous conversations from API
      history.forEach(chat => {
        addMessage(chat.userMessage, true, true); // Add user message
        addMessage(chat.aiResponse, false, true); // Add AI response
      });
    } else {
      console.log("No previous chat history found, showing initial message");
      // Show initial message if no history
      chatMessages.innerHTML = '';
      const initialMessage = document.createElement("div");
      initialMessage.className = "message ai-message";
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      initialMessage.innerHTML = `
        <div class="message-content">Halo! Saya adalah asisten AI cuaca. Tanyakan informasi cuaca di negara mana pun di dunia!</div>
        <span class="timestamp">${timestamp}</span>
      `;
      chatMessages.appendChild(initialMessage);
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } catch (error) {
    console.error("❌ Error loading chat history from API:", error);
    // Fallback to initial message if API loading fails
    chatMessages.innerHTML = '';
    const initialMessage = document.createElement("div");
    initialMessage.className = "message ai-message";
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    initialMessage.innerHTML = `
      <div class="message-content">Halo! Saya adalah asisten AI cuaca. Tanyakan informasi cuaca di negara mana pun di dunia!</div>
      <span class="timestamp">${timestamp}</span>
    `;
    chatMessages.appendChild(initialMessage);
  }
}

// Fungsi 1: Tambah message ke chat
function addMessage(text, isUser = false, isLoading = false) { // Added isLoading flag
  if (!chatMessages) {
    console.error("chatMessages element not found");
    return;
  }

  const messageElement = document.createElement("div");
  messageElement.className = `message ${isUser ? "user-message" : "ai-message"}`;
  
  // Check if this is a weather-related message to apply special formatting
  let formattedText = text;
  if (!isUser) {
    // Format weather-specific information
    formattedText = formatWeatherMessage(text);
  }
  
  // Create message content with timestamp
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  messageElement.innerHTML = `
    <div class="message-content">${formattedText}</div>
    <span class="timestamp">${timestamp}</span>
  `;

  chatMessages.appendChild(messageElement);

  // Only add to conversation history and save if not loading from history
  if (!isLoading) {
    const role = isUser ? "user" : "assistant";
    conversationHistory.push({ role: role, content: text });
    saveChatHistory(); // Save history after each new message
  }

  // Keep conversation history to a reasonable size (last 10 messages + system message)
  if (conversationHistory.length > 11) {
    conversationHistory = [
      conversationHistory[0],
      ...conversationHistory.slice(-10),
    ];
  }

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Add animation effect
  setTimeout(() => {
    messageElement.style.opacity = '1';
    messageElement.style.transform = 'translateY(0)';
  }, 20);
}

// Function to format weather-specific messages with enhanced styling
function formatWeatherMessage(text) {
  // Check if the message contains weather information
  if (text.toLowerCase().includes("suhu") || 
      text.toLowerCase().includes("temperature") || 
      text.toLowerCase().includes("weather") ||
      text.toLowerCase().includes("cuaca") ||
      text.toLowerCase().includes("humidity") ||
      text.toLowerCase().includes("kelembaban") ||
      text.toLowerCase().includes("pressure") ||
      text.toLowerCase().includes("tekanan") ||
      text.toLowerCase().includes("wind") ||
      text.toLowerCase().includes("angin")) {
    
    // Extract weather data and create enhanced display
    let enhancedText = text;
    
    // Look for temperature patterns and highlight them
    enhancedText = enhancedText.replace(/(\d+)°C/g, '<strong style="color: #1976d2;">$1°C</strong>');
    enhancedText = enhancedText.replace(/(\d+)°F/g, '<strong style="color: #1976d2;">$1°F</strong>');
    
    // Highlight humidity, pressure, and wind values
    enhancedText = enhancedText.replace(/(humidity|kelembaban):?\s*(\d+)%/gi, '$1: <strong style="color: #0288d1;">$2%</strong>');
    enhancedText = enhancedText.replace(/(pressure|tekanan):?\s*(\d+)\s*(hpa|mb)/gi, '$1: <strong style="color: #388e3c;">$2 $3</strong>');
    enhancedText = enhancedText.replace(/(wind|angin):?\s*(\d+)\s*(m\/s|km\/h|mph)/gi, '$1: <strong style="color: #f57c00;">$2 $3</strong>');
    
    // Add weather-specific styling if it contains weather data
    if (enhancedText !== text) {
      enhancedText = `<div class="weather-info">${enhancedText}</div>`;
    }
    
    return enhancedText;
  }
  
  return text;
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

// Fungsi 5: Kirim ke Gemini AI (via backend) - Enhanced
async function sendToGemini(message, weatherContext = "") {
  console.log("🔍 Sending message to Gemini API:", message.substring(0, 50) + "...");
  try {
    // Enhance the weather context to make responses more interactive and fun
    let enhancedWeatherContext = weatherContext;
    if (weatherContext) {
      // Add more engaging descriptions based on weather data
      try {
        const weatherData = JSON.parse(weatherContext.replace(/Data Cuaca untuk .*, .*\n/, ''));
        if (weatherData) {
          const temp = weatherData.main?.temp;
          const description = weatherData.weather?.[0]?.description;
          const humidity = weatherData.main?.humidity;
          
          // Create more engaging weather descriptions
          let funDescription = "";
          if (temp > 30) {
            funDescription = " 🌶️ Wah, panas banget nih! Siap-siap deh, jangan lupa bawa topi dan minum banyak air!";
          } else if (temp < 18) {
            funDescription = " ❄️ Wah, dingin nich! Jangan lupa bawa jaket ya!";
          }
          
          if (description && description.includes("rain")) {
            funDescription += " \n 🌧️ Hujan nih, bawa payung atau jas hujan ya!";
          } else if (description && description.includes("cloud")) {
            funDescription += " \n ☁️ Cerah berawan, cuaca nyaman buat jalan-jalan!";
          } else if (description && description.includes("clear")) {
            funDescription += " \n ☀️ Cuaca cerah, sempurna buat aktivitas di luar ruangan!";
          }
          
          enhancedWeatherContext = `${weatherContext}\n${funDescription}`;
        }
      } catch (e) {
        // If parsing fails, continue with original weather context
        console.log("Could not parse weather data for enhanced context");
      }
    }

    // Try the /api/chat endpoint first (as specified in requirements)
    const response = await fetch(`${BACKEND_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        weatherContext: enhancedWeatherContext,
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
      console.log("✅ Gemini API response received successfully");
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
        console.log("✅ Gemini fallback API response received successfully");
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
  console.log("🔍 handleSendMessage called");
  
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
  chatInput.focus(); // Keep focus on input after sending

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
    console.log("✅ Message processing completed");
  }
}

// Show typing indicator
function showTyping() {
  if (typingIndicator) {
    typingIndicator.classList.add("active");
    // Add dots to typing indicator
    typingIndicator.innerHTML = `
      <span>AI sedang mengetik</span>
      <div class="typing-indicator-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  }
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Hide typing indicator
function hideTyping() {
  if (typingIndicator) {
    typingIndicator.classList.remove("active");
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
