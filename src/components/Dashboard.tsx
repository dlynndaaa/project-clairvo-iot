'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// Tipe data untuk Sensor
interface SensorData {
  co2: number;
  particulate: number;
  temperature: number;
  fan_status: boolean;
  created_at?: string;
}

// Tipe data untuk Settings
interface FanSettings {
  is_auto_mode: boolean;
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

  // 1. Update Jam Digital
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // 2. Fetch Data dari API (Polling)
  const fetchData = async () => {
    try {
      // Ambil Data Sensor & History
      const resSensor = await fetch('/api/sensor/readings');
      const jsonSensor = await resSensor.json();
      
      if (jsonSensor.success && jsonSensor.data.length > 0) {
        const latest = jsonSensor.data[0]; // Data paling baru
        setSensorData({
          temperature: parseFloat(latest.temperature || 0),
          co2: parseFloat(latest.co2 || 0),
          particulate: parseFloat(latest.particulate || 0),
          fan_status: latest.fan_status,
        });
        
        // Ambil data untuk grafik (reverse agar urutan waktu benar kiri ke kanan)
        setHistoryData(jsonSensor.data.slice(0, 20).reverse());
      }

      // Ambil Status Mode Auto/Manual
      const resSettings = await fetch('/api/fan/settings');
      const jsonSettings = await resSettings.json();
      if (jsonSettings) {
        setIsAutoMode(jsonSettings.is_auto_mode);
      }
      setIsLoading(false);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  // Jalankan Polling setiap 2 detik
  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // 3. Logic Toggle Mode Otomatis (Simpan ke DB)
  const toggleAutoMode = async () => {
    const newMode = !isAutoMode;
    setIsAutoMode(newMode); // Update UI Instan

    try {
      await fetch('/api/fan/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_auto_mode: newMode,
          // Kirim nilai default threshold agar tidak error
          fan_on_threshold_co2: 150, 
          fan_on_threshold_particulate: 50,
          danger_threshold_co2: 250,
          danger_threshold_particulate: 75
        })
      });
    } catch (e) {
      console.error("Gagal update setting", e);
      setIsAutoMode(!newMode); // Revert jika gagal
    }
  };

  // 4. Logic Status Kualitas Udara (Berdasarkan Threshold)
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

  // Helper Component: Gauge Chart (Speedometer)
  const GaugeChart = ({ value, max, color, unit }: { value: number; max: number; color: string; unit: string }) => {
    const percentage = Math.min((value / max) * 100, 100); // Cap at 100%
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

  // Helper Function: Generate Points untuk Grafik SVG
  const generateChartPoints = () => {
    if (historyData.length === 0) return "";
    const width = 360; // Lebar area grafik SVG
    const height = 150; // Tinggi area grafik SVG
    const maxVal = 500; // Skala max Y (CO2 ppm)
    
    // Mapping data ke koordinat SVG
    const points = historyData.map((data, index) => {
      const x = (index / (historyData.length - 1 || 1)) * width + 20; // X rata
      const y = height - (Math.min(data.co2, maxVal) / maxVal) * height + 20; // Y inverted
      return `${x},${y}`;
    });
    
    return points.join(" ");
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      {/* Header */}
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
        
        {/* Status Banner */}
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
            
            {/* Alert Box Kipas */}
            {(isAutoMode && airQuality.status !== 'AMAN') && (
              <div className="mt-4 md:mt-0 bg-black/20 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/10">
                 <p className="text-sm font-bold flex items-center gap-2">
                   🌀 Kipas otomatis menyala sebagai pencegahan.
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* --- BAGIAN 1: SENSOR (Baris Atas) --- */}
        <div className="mb-6">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Pembacaan Sensor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card CO2 */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col items-center shadow-lg">
              <h4 className="text-gray-400 text-sm font-medium mb-4">CO / Gas</h4>
              <GaugeChart value={sensorData.co2} max={500} color="text-yellow-400" unit="ppm" />
              <p className="text-xs text-gray-500 mt-4 px-2 py-1 bg-gray-900 rounded">• Ambang Batas: 150 ppm</p>
            </div>
            
            {/* Card Debu */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 flex flex-col items-center shadow-lg">
              <h4 className="text-gray-400 text-sm font-medium mb-4">Debu (PM)</h4>
              <GaugeChart value={sensorData.particulate} max={100} color="text-green-400" unit="µg/m³" />
              <p className="text-xs text-gray-500 mt-4 px-2 py-1 bg-gray-900 rounded">• Ambang Batas: 50 µg/m³</p>
            </div>
          </div>
        </div>

        {/* --- BAGIAN 2: KONTROL & GRAFIK (Baris Bawah) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* KOLOM KIRI: Kontrol Kipas */}
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

          {/* KOLOM KANAN: Grafik Tren */}
          <div>
            <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span> Grafik Tren (Real-time)
            </h3>
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg h-[calc(100%-2.5rem)]">
              <div className="h-48 w-full relative">
                <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="40" y2="180" stroke="#374151" strokeWidth="1" />
                  <line x1="40" y1="180" x2="380" y2="180" stroke="#374151" strokeWidth="1" />
                  
                  {/* Labels Y Axis */}
                  <text x="35" y="25" fontSize="10" fill="#9CA3AF" textAnchor="end">500</text>
                  <text x="35" y="100" fontSize="10" fill="#9CA3AF" textAnchor="end">250</text>
                  <text x="35" y="185" fontSize="10" fill="#9CA3AF" textAnchor="end">0</text>
                  
                  {/* The Chart Line */}
                  {historyData.length > 1 ? (
                    <polyline
                      points={generateChartPoints()}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="drop-shadow-lg"
                    />
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