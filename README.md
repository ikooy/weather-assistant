# World Explorer - Informasi Negara & Cuaca

Aplikasi web yang menyediakan informasi negara lengkap dengan data cuaca real-time dan prediksi musim berdasarkan lokasi geografis. Dibangun menggunakan teknologi cloud computing dengan integrasi berbagai layanan API.

## 📋 Fitur Utama

- **Informasi Negara Lengkap**: Data negara termasuk ibu kota, populasi, bahasa, mata uang, zona waktu, dll.
- **Cuaca Real-time**: Data cuaca aktual dari OpenWeatherMap API
- **Prediksi Musim**: Berdasarkan lokasi geografis (latitude/longitude) dan bulan saat ini
- **Interactive Maps**: Menampilkan lokasi negara pada peta interaktif
- **AI Chat**: Fitur percakapan dengan AI untuk informasi cuaca (menggunakan Google Gemini API)
- **Multi Cloud Integration**: Terintegrasi dengan berbagai layanan cloud (REST Countries API, OpenWeatherMap API, OpenStreetMap API)

## 🛠️ Teknologi yang Digunakan

- **Backend**: Node.js dengan Express.js
- **Frontend**: HTML, CSS, JavaScript
- **APIs**: 
  - REST Countries API
  - OpenWeatherMap API
  - Google Gemini API (untuk AI chat)
- **Maps**: Leaflet.js dengan OpenStreetMap tiles
- **Styling**: Tailwind CSS, CSS3 Animations
- **Environment**: dotenv untuk manajemen konfigurasi

## 🚀 Instalasi

Ikuti langkah-langkah berikut untuk menjalankan aplikasi secara lokal:

### Prerequisites
- Node.js (versi 14 atau lebih tinggi)
- npm (biasanya disertakan dengan Node.js)

### Langkah-langkah Instalasi

1. Clone atau download repo ini ke komputer Anda

2. Masuk ke direktori project:
```bash
cd PROJECT WEBSITE API
```

3. Install dependencies:
```bash
npm install
```

4. Buat file `.env` di root direktori dan isi dengan API keys berikut:
```env
# Weather API
WEATHER_API_KEY=9f5da2646c399356922ecd13e8493f0b

# Google Gemini API
GEMINI_API_KEY=AIzaSyAv7EhBNHVi3JtASjeraQ0vWZmRbVomnNM

# Backend API URL
BACKEND_API_URL=http://localhost:3000
```

> **Catatan**: Ganti API keys di atas dengan keys Anda sendiri dari:
> - [OpenWeatherMap](https://openweathermap.org/api) untuk `WEATHER_API_KEY`
> - [Google AI Studio](https://makersuite.google.com/app/apikey) untuk `GEMINI_API_KEY`

5. Jalankan server:
```bash
npm start
```
atau
```bash
node server.js
```

6. Buka browser dan akses:
   - Utama: [http://localhost:3000](http://localhost:3000)
   - Chat AI: [http://localhost:3000/chat](http://localhost:3000/chat)

## 🎯 Cara Penggunaan

### Mencari Informasi Negara
1. Buka [http://localhost:3000](http://localhost:3000)
2. Masukkan nama negara dalam bahasa Inggris di kolom pencarian (contoh: indonesia, japan, france)
3. Klik tombol "🌤️ Cari Informasi & Cuaca" atau tekan Enter
4. Tunggu hingga data negara dan cuaca ditampilkan

### Menggunakan Chat AI Cuaca
1. Buka [http://localhost:3000/chat](http://localhost:3000/chat)
2. Ketik pertanyaan tentang cuaca, contoh:
   - "Bagaimana cuaca di Jakarta?"
   - "Weather in Tokyo"
   - "Suhu di London sekarang berapa?"
3. Tekan Enter atau klik tombol "Kirim"
4. AI akan memberikan informasi cuaca dan jawaban berdasarkan konteks

## 🏗️ Struktur Proyek

```
PROJECT WEBSITE API/
│
├── index.html          # Halaman utama
├── chat-ai.html        # Halaman chat AI
├── script.js           # Logic frontend
├── server.js           # Server Node.js dengan endpoint API
├── style.css           # Styling
├── .env                # Konfigurasi environment
├── package.json        # Dependencies
└── node_modules/       # Dependencies (dihasilkan oleh npm)
```

## 🌐 Endpoint API

- `GET /` - Halaman utama aplikasi
- `GET /chat` - Halaman chat AI
- `GET /api/weather/:city` - Mendapatkan data cuaca untuk kota tertentu
- `POST /api/gemini` - Interaksi dengan Google Gemini AI

## 🔧 Konfigurasi Backend

Server Express di `server.js` menyediakan:
- Routing untuk halaman utama dan chat AI
- Serving file statis dari root direktori
- Handled CORS
- Endpoint `/api/weather/:city` untuk mendapatkan data cuaca secara aman
- Endpoint `/api/gemini` untuk permintaan AI menggunakan Google Gemini

## ☁️ Cloud Computing Integration

Aplikasi ini merupakan implementasi dari konsep cloud computing dengan:
- **Software as a Service (SaaS)**: REST Countries API dan OpenWeatherMap API
- **Platform as a Service (PaaS)**: Google Gemini API
- **Real-time Data Processing**: Data cuaca secara real-time dari ratusan stasiun meteorologi
- **Data Analytics**: Prediksi musim berdasarkan data historis dan koordinat geografis

## 🔒 Keamanan

- API keys disimpan di file `.env` dan tidak di-commit ke repository
- Penggunaan CORS untuk komunikasi cross-origin yang aman
- Validasi dan error handling untuk semua API calls

## 📱 Responsif

Aplikasi ini dirancang responsif dan dapat diakses dari berbagai perangkat:
- Desktop
- Tablet
- Mobile devices

## 🧪 Testing

Saat ini aplikasi belum memiliki test suites. Untuk testing manual:
1. Pastikan semua API keys valid
2. Uji fitur pencarian negara dengan berbagai nama negara
3. Uji fitur chat AI dengan berbagai pertanyaan cuaca
4. Pastikan peta muncul dengan benar
5. Verifikasi prediksi musim akurat berdasarkan lokasi

## 🔧 Troubleshooting

### Masalah Umum:
- **API Keys tidak valid**: Pastikan API keys di `.env` benar dan aktif
- **Data tidak muncul**: Periksa koneksi internet dan validitas nama negara
- **Error CORS**: Pastikan server berjalan di `http://localhost:3000`

### Error Umum:
- "Negara tidak ditemukan": Gunakan nama negara dalam bahasa Inggris
- "Data cuaca tidak tersedia": Pastikan API key cuaca valid
- "Server tidak bisa diakses": Pastikan port 3000 tidak digunakan aplikasi lain

## 🌐 Deployment

Untuk production deployment, Anda perlu:
1. Deploy server ke platform cloud (Heroku, Railway, atau lainnya)
2. Pastikan environment variables disediakan
3. Gunakan domain SSL jika tersedia
4. Monitor API usage untuk menghindari kuota terlampaui

## 🤝 Kontribusi

1. Fork repo ini
2. Buat branch fitur (`git checkout -b feature/NewFeature`)
3. Commit perubahan (`git commit -m 'Add NewFeature'`)
4. Push ke branch (`git push origin feature/NewFeature`)
5. Buat Pull Request

## 📜 Lisensi

Proyek ini berada di bawah lisensi ISC - lihat file `LICENSE` untuk detail.

## 👥 Kelompok

**Cloud Innovators**
- NIM: 202501001
- NIM: 202501002
- NIM: 202501003

## 🎓 Mata Kuliah

**Cloud Computing UTS**
- STT Wastukancana

## 🆘 Dukungan

Jika Anda mengalami masalah dengan aplikasi, silakan buka issue di repository ini atau hubungi pengembang.