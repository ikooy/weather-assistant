// API Configuration
const COUNTRIES_API = "https://restcountries.com/v3.1";
// The weather API key should come from the environment, but since this is frontend,
// it has to be hardcoded or we need a backend endpoint to get weather data securely
const WEATHER_API_KEY = "9f5da2646c399356922ecd13e8493f0b"; // Dapatkan gratis dari OpenWeatherMap
const WEATHER_API = "https://api.openweathermap.org/data/2.5";

// DOM Elements
const countryInput = document.getElementById("countryInput");
const searchBtn = document.getElementById("searchBtn");
const resultSection = document.getElementById("result");
const weatherSection = document.getElementById("weatherSection");
const loadingElement = document.getElementById("loading");
const errorSection = document.getElementById("error");

// Event Listeners
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
    // Get country data
    const countryResponse = await fetch(`${COUNTRIES_API}/name/${countryName}`);
    if (!countryResponse.ok) {
      throw new Error("Negara tidak ditemukan!");
    }

    const countryData = await countryResponse.json();
    const country = countryData[0];

    // Display country info
    displayCountryInfo(country);

    // Get weather data if capital exists
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

// Get weather data
async function getWeatherData(city, coordinates, countryName) {
  try {
    // Using backend proxy to avoid exposing API key in frontend
    const weatherResponse = await fetch(
      `/api/weather/${city}`
    );

    if (!weatherResponse.ok) {
      throw new Error("Data cuaca tidak tersedia");
    }

    const weatherData = await weatherResponse.json();
    displayWeatherInfo(weatherData, countryName, coordinates);
  } catch (error) {
    console.log("Weather data unavailable:", error);
    // Fallback: Show seasonal prediction based on coordinates
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

  // Initialize map
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

  // Adjust month for southern hemisphere (seasons are opposite)
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
// Initialize map - FIXED VERSION
function initializeMap(lat, lng, countryName) {
  // Hapus map existing jika ada
  if (window.map) {
    window.map.remove();
  }

  // Clear container dulu
  const mapContainer = document.getElementById("countryMap");
  mapContainer.innerHTML = "";

  // Buat map baru dengan delay kecil
  setTimeout(() => {
    window.map = L.map("countryMap").setView([lat, lng], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(window.map);

    // Tambah marker
    L.marker([lat, lng])
      .addTo(window.map)
      .bindPopup(`<b>${countryName}</b><br>Lat: ${lat}, Lng: ${lng}`)
      .openPopup();

    // Force map refresh setelah render - INI YANG PENTING!
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

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  // Add floating animation to cloud cards
  const cloudCards = document.querySelectorAll(".cloud-card");
  cloudCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });

  // Focus on input when page loads
  countryInput.focus();

  // Add sample countries for quick testing
  const sampleCountries = ["Indonesia", "Japan", "Brazil", "Germany", "Canada"];
  const randomCountry =
    sampleCountries[Math.floor(Math.random() * sampleCountries.length)];
  countryInput.placeholder = `Ketik nama negara (contoh: ${randomCountry.toLowerCase()})...`;
});

console.log(`
🌍 World Explorer - Cloud Computing UTS
📍 Integrated with REST Countries API
🌤️ Integrated with Weather Data
🗺️ Multiple Cloud Services Implementation
🔮 Seasonal Prediction Feature
`);
