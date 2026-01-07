'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, update } from 'firebase/database';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Tipe data untuk Sensor
interface SensorData {
  co2: number;
  particulate: number;
  temperature: number;
  fan_status: boolean;
  created_at?: string;
}

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  // 1. Inisialisasi DB yang aman agar tidak re-init terus menerus
  const db = useMemo(() => {
    if (typeof window !== 'undefined') {
      try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        return getDatabase(app);
      } catch (error) {
        console.error('Firebase initialization error:', error);
        return null;
      }
    }
    return null;
  }, []);

  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 0,
    co2: 0,
    particulate: 0,
    fan_status: false,
  });

  const [historyData, setHistoryData] = useState<SensorData[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 2. Update Jam Digital
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // 3. LOGIKA FIREBASE: Real-time Data & Fan Settings
  useEffect(() => {
    if (!db) return;

    // Listener Data Sensor
    const sensorRef = ref(db, 'sensor_readings/latest');
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = {
          temperature: parseFloat(data.temperature || 0),
          co2: parseFloat(data.co2 || 0),
          particulate: parseFloat(data.particulate || 0),
          fan_status: !!data.fan_status,
          created_at: data.created_at || new Date().toISOString(),
        };
        setSensorData(formattedData);
        setHistoryData(prev => [formattedData, ...prev].slice(0, 20));
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Gagal memuat data sensor. Cek Rules Firebase Anda:', error);
      setIsLoading(false);
    });

    // Listener Fan Settings
    const settingsRef = ref(db, 'fan_settings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data.is_auto_mode === 'boolean') {
        setIsAutoMode(data.is_auto_mode);
      }
    });

    return () => {
      unsubscribeSensor();
      unsubscribeSettings();
    };
  }, [db]);

  // 4. Update Mode Otomatis
  const toggleAutoMode = async () => {
    if (!db) return;
    const newMode = !isAutoMode;
    setIsAutoMode(newMode); 
    try {
      await update(ref(db, 'fan_settings'), { 
        is_auto_mode: newMode,
        fan_on_threshold_co2: 150, 
        fan_on_threshold_particulate: 50,
      });
    } catch (e) {
      console.error("Gagal update setting", e);
      setIsAutoMode(!newMode);
    }
  };

  // 5. Control Kipas Manual
  const controlFanManual = async (status: boolean) => {
    if (!db || isAutoMode) return;
    try {
      await update(ref(db, 'sensor_readings/latest'), { 
        fan_status: status
      });
    } catch (e) {
      console.error("Gagal kontrol kipas:", e);
    }
  };

  // 6. Logic Status Udara (Asli)
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

  // Helper Components (Asli)
  const GaugeChart = ({ value, max, color, unit }: any) => {
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

  // --- JSX RENDER (TAMPILAN PERSIS SEPERTI KODE LAMA ANDA) ---
  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            </div>
            <h2 className="text-white text-lg font-semibold">Memuat Data Sensor...</h2>
            <p className="text-gray-400 text-sm mt-2">Menghubungkan ke Firebase...</p>
          </div>
        </div>
      )}

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
        <div className={`rounded-xl p-6 mb-8 shadow-xl bg-gradient-to-r ${airQuality.color} ${airQuality.textColor}`}>
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
                 <p className="text-sm font-bold flex items-center gap-2">🌀 Kipas otomatis menyala sebagai pencegahan.</p>
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

        <div className="grid grid-cols-1 gap-6">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Kontrol Kipas
          </h3>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
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
              <button onClick={() => controlFanManual(true)} disabled={isAutoMode} className={`py-3 rounded-lg font-bold transition-all ${!isAutoMode ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>Nyalakan</button>
              <button onClick={() => controlFanManual(false)} disabled={isAutoMode} className={`py-3 rounded-lg font-bold transition-all ${!isAutoMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>Matikan</button>
            </div>

            <div className={`w-full py-3 rounded-lg text-center font-bold tracking-wider border transition-colors ${sensorData.fan_status ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-gray-700/50 text-gray-500 border-gray-600'}`}>
              STATUS KIPAS: {sensorData.fan_status ? 'AKTIF 🌀' : 'MATI ⭕'}
            </div>
            {isAutoMode && <p className="text-center text-xs text-yellow-500 mt-3 flex justify-center items-center gap-1">🔒 Tombol terkunci di Mode Otomatis</p>}
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-xs border-t border-gray-800 pt-6">
          &copy; {new Date().getFullYear()} Clairvo Team. Air Quality Monitoring System for Bengkel Harum Motor.
        </footer>
      </main>
    </div>
  );
}