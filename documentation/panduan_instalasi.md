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

## Struktur Proyek
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

- Jika Anda mengalami kesalahan izin (permission errors), pastikan Anda memiliki izin file yang benar
- Jika server tidak bisa berjalan, pastikan file `.env` Anda dikonfigurasi dengan benar
- Pastikan port 3000 tidak digunakan oleh aplikasi lain

## Endpoint API

- `GET /` - Halaman utama aplikasi
- `GET /api/weather/:city` - Mendapatkan data cuaca untuk sebuah kota
- `POST /api/gemini` - Berkomunikasi dengan asisten AI