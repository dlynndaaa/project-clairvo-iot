'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// Import Firebase (Pastikan kamu sudah install: npm install firebase)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, update } from 'firebase/database';

// --- KONFIGURASI FIREBASE ---
// Masukkan config milikmu di sini
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID_KAMU.firebaseapp.com",
  databaseURL: "URL_DATABASE_FIREBASE_KAMU",
  projectId: "PROJECT_ID_KAMU",
  storageBucket: "PROJECT_ID_KAMU.appspot.com",
  messagingSenderId: "SENDER_ID_KAMU",
  appId: "APP_ID_KAMU"
};

// Inisialisasi Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

// Tipe data untuk Sensor
interface SensorData {
  co2: number;
  particulate: number;
  temperature: number;
  fan_status: boolean;
  created_at?: string;
}

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  // State untuk Data Sensor Real-time
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    co2: 0,
    particulate: 0,
    fan_status: false,
  });

  // State untuk History Grafik
  const [historyData, setHistoryData] = useState<SensorData[]>([]);
  
  // State untuk Mode Kipas & Waktu
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Update Jam Digital (Tetap sama)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // 2. LOGIKA FIREBASE: Real-time Data & Fan Settings
  useEffect(() => {
    let historyBuffer: SensorData[] = [];

    // Listener untuk Data Sensor Terbaru (/sensor_readings/latest)
    const sensorRef = ref(db, 'sensor_readings/latest');
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = {
          temperature: parseFloat(data.temperature || 0),
          co2: parseFloat(data.co2 || 0),
          particulate: parseFloat(data.particulate || 0),
          fan_status: data.fan_status,
          created_at: data.created_at || new Date().toISOString(),
        };

        setSensorData(formattedData);

        // Update history buffer untuk grafik (20 records)
        historyBuffer = [formattedData, ...historyBuffer].slice(0, 20);
        setHistoryData([...historyBuffer].reverse());
        setIsLoading(false);
      }
    });

    // Listener untuk Fan Settings (/fan_settings)
    const settingsRef = ref(db, 'fan_settings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setIsAutoMode(data.is_auto_mode);
      }
    });

    // Cleanup listeners saat component di-unmount
    return () => {
      unsubscribeSensor();
      unsubscribeSettings();
    };
  }, []);

  // 3. LOGIKA FIREBASE: Update Mode Otomatis
  const toggleAutoMode = async () => {
    const newMode = !isAutoMode;
    // Update local UI state untuk respon cepat
    setIsAutoMode(newMode); 

    try {
      // Update langsung ke Firebase
      const settingsRef = ref(db, 'fan_settings');
      await update(settingsRef, { 
        is_auto_mode: newMode,
        // Sertakan threshold default agar data di Firebase tetap lengkap
        fan_on_threshold_co2: 150, 
        fan_on_threshold_particulate: 50,
        danger_threshold_co2: 250,
        danger_threshold_particulate: 75
      });
    } catch (e) {
      console.error("Gagal update setting ke Firebase", e);
      setIsAutoMode(!newMode); // Revert jika gagal
    }
  };

  // 4. Logic Status Kualitas Udara (Tetap sama)
  const getAirQualityStatus = () => {
    const { co2, particulate } = sensorData;
    if (co2 > 250 || particulate > 75) {
      return { status: 'BERBAHAYA', color: 'from-red-600 to-red-500', textColor: 'text-white', icon: '🚨' };
    } else if (co2 > 150 || particulate > 50) {
      return { status: 'WARNING', color: 'from-yellow-400 to-yellow-300', textColor: 'text-yellow-900', icon: '⚡' };
    } else {
      return { status: 'AMAN', color: 'from-green-500 to-green-400', textColor: 'text-white', icon: '✅' };
    }
  };

  const airQuality = getAirQualityStatus();

  // Helper Component & Function Grafik (Tetap sama)
  const GaugeChart = ({ value, max, color, unit }: { value: number; max: number; color: string; unit: string }) => {
    const percentage = Math.min((value / max) * 100, 100);
    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r="45" fill="none" stroke="#374151" strokeWidth="8" opacity="0.3" pathLength="180" strokeDasharray="180" />
          <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="8" pathLength="180" strokeDasharray={`${percentage * 1.8} 180`} className={color} strokeLinecap="round" />
          <circle cx="60" cy="60" r="30" fill="#1f2937" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>
    );
  };

  const generateChartPoints = () => {
    if (historyData.length === 0) return "";
    const width = 360;
    const height = 150;
    const maxVal = 500;
    const points = historyData.map((data, index) => {
      const x = (index / (historyData.length - 1 || 1)) * width + 20;
      const y = height - (Math.min(data.co2, maxVal) / maxVal) * height + 20;
      return `${x},${y}`;
    });
    return points.join(" ");
  };

  // --- JSX RENDER (Tampilan tidak diubah sedikitpun) ---
  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/clairvo-logo-white.png" alt="Logo" width={40} height={40} className="h-8 w-auto" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Dashboard Monitoring <span className="hidden sm:inline text-gray-400">- Bengkel Harum Motor</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-gray-300">
              Welcome, <span className="font-bold text-white">{user?.name}</span>
            </span>
            <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className={`rounded-xl p-6 mb-8 shadow-xl bg-linear-to-r ${airQuality.color} ${airQuality.textColor}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">KONDISI UDARA BENGKEL SEKARANG</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{airQuality.icon}</span>
                <h2 className="text-5xl font-extrabold tracking-tight">{airQuality.status}</h2>
              </div>
              <p className="mt-2 text-sm font-medium opacity-90">Real-time: {currentTime}</p>
            </div>
            
            {(isAutoMode && airQuality.status !== 'AMAN') && (
              <div className="mt-4 md:mt-0 bg-black/20 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
                 <p className="text-sm font-bold flex items-center gap-2">
                   🌀 Kipas otomatis menyala sebagai pencegahan.
                 </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Pembacaan Sensor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col items-center shadow-lg">
              <h4 className="text-gray-400 text-sm font-medium mb-4">CO / Gas</h4>
              <GaugeChart value={sensorData.co2} max={500} color="text-yellow-400" unit="ppm" />
              <p className="text-xs text-gray-500 mt-4 px-2 py-1 bg-gray-900 rounded">• Ambang Batas: 150 ppm</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col items-center shadow-lg">
              <h4 className="text-gray-400 text-sm font-medium mb-4">Debu (PM)</h4>
              <GaugeChart value={sensorData.particulate} max={100} color="text-green-400" unit="µg/m³" />
              <p className="text-xs text-gray-500 mt-4 px-2 py-1 bg-gray-900 rounded">• Ambang Batas: 50 µg/m³</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Kontrol Kipas
            </h3>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg h-[calc(100%-2.5rem)]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <span className="text-gray-300 font-medium">Mode Otomatis</span>
                  <span className="text-xs text-gray-500">{isAutoMode ? 'Sensor mengontrol kipas' : 'Kontrol manual aktif'}</span>
                </div>
                <button onClick={toggleAutoMode} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isAutoMode ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAutoMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <button disabled={isAutoMode} className={`py-3 rounded-lg font-bold transition-all ${!isAutoMode ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                  Nyalakan
                </button>
                <button disabled={isAutoMode} className={`py-3 rounded-lg font-bold transition-all ${!isAutoMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                  Matikan
                </button>
              </div>

              <div className={`w-full py-3 rounded-lg text-center font-bold tracking-wider transition-colors ${sensorData.fan_status ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-700/50 text-gray-500 border border-gray-600'}`}>
                STATUS KIPAS: {sensorData.fan_status ? 'AKTIF 🌀' : 'MATI ⭕'}
              </div>
              {isAutoMode && <p className="text-center text-xs text-yellow-500 mt-3 flex justify-center items-center gap-1">🔒 Tombol terkunci di Mode Otomatis</p>}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Grafik Tren (Real-time)
            </h3>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg h-[calc(100%-2.5rem)]">
              <div className="h-48 w-full relative">
                <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
                  <line x1="40" y1="20" x2="40" y2="180" stroke="#374151" strokeWidth="1" />
                  <line x1="40" y1="180" x2="380" y2="180" stroke="#374151" strokeWidth="1" />
                  <text x="35" y="25" fontSize="10" fill="#9CA3AF" textAnchor="end">500</text>
                  <text x="35" y="100" fontSize="10" fill="#9CA3AF" textAnchor="end">250</text>
                  <text x="35" y="185" fontSize="10" fill="#9CA3AF" textAnchor="end">0</text>
                  {historyData.length > 1 ? (
                    <polyline points={generateChartPoints()} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                  ) : (
                    <text x="200" y="100" textAnchor="middle" fill="#6B7280" fontSize="12">Menunggu Data...</text>
                  )}
                </svg>
              </div>
              <div className="flex items-center gap-2 mt-2 justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Gas Berbahaya (ppm)</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-xs border-t border-gray-800 pt-6">
          &copy; {new Date().getFullYear()} Clairvo Team. Air Quality Monitoring System for Bengkel Harum Motor.
        </footer>
      </main>
    </div>
  );
}