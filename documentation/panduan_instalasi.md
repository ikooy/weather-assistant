# Weather Assistant - Panduan Instalasi

Panduan ini menjelaskan cara mengatur dan menjalankan proyek Weather Assistant di komputer lokal Anda.

## Prasyarat

- [Node.js](https://nodejs.org/) (versi 14 atau lebih tinggi)
- npm (biasanya sudah termasuk dalam Node.js)

## Langkah-langkah Instalasi

### 1. Klone atau Unduh Proyek
```bash
git clone <repository-url>
# atau unduh dan ekstrak file-file proyek
```

### 2. Masuk ke Direktori Proyek
```bash
cd weather-assistant
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Konfigurasi Lingkungan (Environment)
- Buat file `.env` di direktori `backend/src/` berdasarkan file `.env copy`
- Tambahkan API key Anda untuk:
  - Weather API (OpenWeatherMap)
  - Google Generative AI (Gemini)

Contoh konten file `.env`:
```
WEATHER_API_KEY=your_openweathermap_api_key
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
```

### 5. Jalankan Aplikasi
```bash
# Menggunakan npm
npm start

# Atau langsung dengan node
node backend/src/server.js
```

### 6. Akses Aplikasi
Buka browser Anda dan buka: `http://localhost:3000`

## Integrasi Frontend dan Backend

Proyek Weather Assistant terdiri dari dua komponen utama yang terintegrasi:

### Frontend
- Terletak di direktori `frontend/src/`
- Terdiri dari file HTML, CSS, dan JavaScript
- Menggunakan API dari backend untuk mendapatkan data cuaca dan berkomunikasi dengan AI
- Menggunakan Tailwind CSS untuk styling dan Leaflet untuk peta

### Backend
- Terletak di direktori `backend/src/`
- Server Express.js yang menyediakan API untuk frontend
- Menyajikan file-file frontend secara statis
- Mengintegrasikan API OpenWeatherMap dan Google Generative AI (Gemini)
- Menggunakan CORS untuk mengizinkan permintaan lintas domain

### Integrasi Antar Komponen
- Frontend mengakses data cuaca melalui endpoint `/api/weather/:city` dari backend
- Frontend berkomunikasi dengan AI melalui endpoint `/api/gemini` dari backend
- Backend menyajikan file-file HTML, CSS, dan JavaScript secara statis ke browser
- Semua permintaan API dari frontend ditangani oleh backend

## Struktur Proyek
```
weather-assistant/
├── frontend/
│   └── src/
│       ├── index.html
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── script.js
├── backend/
│   └── src/
│       ├── server.js
│       └── .env
├── documentation/
│   └── panduan_instalasi.md
└── package.json
```

## Endpoint API

### Frontend Endpoints
- `GET /` - Halaman utama aplikasi
- Menyajikan file `index.html` dari direktori frontend

### Backend API Endpoints
- `GET /api/weather/:city` - Mendapatkan data cuaca untuk sebuah kota melalui OpenWeatherMap
- `POST /api/gemini` - Berkomunikasi dengan asisten AI Gemini

## Troubleshooting

- Jika Anda mengalami kesalahan izin (permission errors), pastikan Anda memiliki izin file yang benar
- Jika server tidak bisa berjalan, pastikan file `.env` Anda dikonfigurasi dengan benar
- Pastikan port 3000 tidak digunakan oleh aplikasi lain
- Pastikan API key untuk OpenWeatherMap dan Gemini telah dikonfigurasi dengan benar
- Jika terjadi kesalahan CORS, pastikan konfigurasi CORS di `server.js` berfungsi dengan baik

## Konfigurasi Lingkungan

Pastikan untuk mengisi file `.env` dengan API key yang valid:

- WEATHER_API_KEY: API key dari OpenWeatherMap
- GEMINI_API_KEY: API key dari Google AI Studio untuk layanan Gemini
- PORT: Port yang digunakan untuk menjalankan server (default: 3000)