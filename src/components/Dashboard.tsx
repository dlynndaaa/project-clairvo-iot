'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [isFanOn, setIsFanOn] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [sensorData, setSensorData] = useState({
    temperature: 28.5,
    co2: 150,
    particulate: 35,
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds} WIB`);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prevData) => {
        const newData = {
          temperature: parseFloat((Math.random() * 5 + 26).toFixed(1)),
          co2: Math.floor(Math.random() * 100 + 100),
          particulate: Math.floor(Math.random() * 40 + 25),
        };

        if (isAutoMode) {
          // BERBAHAYA - Kipas menyala
          if (newData.co2 > 250 || newData.particulate > 75) {
            setIsFanOn(true);
          }
          // WARNING - Kipas menyala
          else if (newData.co2 > 150 || newData.particulate > 50) {
            setIsFanOn(true);
          }
          // AMAN - Kipas mati
          else {
            setIsFanOn(false);
          }
        }

        return newData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoMode]);

  // Determine air quality status
  const getAirQualityStatus = () => {
    if (sensorData.co2 > 250 || sensorData.particulate > 75) {
      return { status: 'BERBAHAYA', color: 'from-red-500 to-red-400', textColor: 'text-red-900', icon: '⚠️' };
    } else if (sensorData.co2 > 150 || sensorData.particulate > 50) {
      return { status: 'WARNING', color: 'from-yellow-400 to-yellow-300', textColor: 'text-yellow-900', icon: '⚡' };
    } else {
      return { status: 'AMAN', color: 'from-green-400 to-green-300', textColor: 'text-green-900', icon: '✓' };
    }
  };

  const airQuality = getAirQualityStatus();

  const GaugeChart = ({ value, max, color, unit }: { value: number; max: number; color: string; unit: string }) => {
    const percentage = (value / max) * 100;
    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle cx="60" cy="60" r="45" fill="none" stroke="#374151" strokeWidth="8" opacity="0.3" pathLength="180" strokeDasharray="180" />
          <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="8" pathLength="180" strokeDasharray={`${percentage * 1.8} 180`} className={color} strokeLinecap="round" />
          <circle cx="60" cy="60" r="30" fill="#111827" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
            <Image
              src="/clairvo-logo-white.png"
              alt="Clairvo Logo"
              width={40}
              height={40}
              className="h-8 w-auto object-contain"
            />
            <span className="hidden sm:inline">Dashboard Monitoring - Bengkel Harum Motor</span>
            <span className="sm:hidden">Monitoring</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-gray-300 text-sm">Welcome, <strong>{user?.name}</strong></span>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 sm:px-4 rounded transition-colors flex items-center gap-2"
              title={`Logout - ${user?.name}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Air Quality Status */}
        <div className={`bg-linear-to-r ${airQuality.color} rounded-lg p-6 ${airQuality.textColor}`}>
          <h2 className="text-sm font-semibold opacity-70 mb-2">KONDISI UDARA BENGKEL SEKARANG</h2>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{airQuality.icon}</span>
            <h3 className="text-5xl font-bold">{airQuality.status}</h3>
          </div>
          <p className="text-sm opacity-75">Real-time: {currentTime}</p>
          {airQuality.status === 'BERBAHAYA' && (
            <div className="mt-3 p-3 bg-black/20 rounded text-sm font-semibold">
              🚨 Kipas otomatis menyala! Ventilasi sedang aktif.
            </div>
          )}
          {airQuality.status === 'WARNING' && (
            <div className="mt-3 p-3 bg-black/20 rounded text-sm font-semibold">
              ⚡ Kipas otomatis menyala sebagai pencegahan.
            </div>
          )}
        </div>

        {/* Real-time Sensor Readings */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pembacaan Sensor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-4">Suhu</h3>
              <GaugeChart value={sensorData.temperature} max={50} color="text-blue-400" unit="°C" />
              <p className="text-xs text-gray-500 mt-2">• Biasa</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-4">CO / Gas</h3>
              <GaugeChart value={sensorData.co2} max={500} color="text-yellow-400" unit="ppm" />
              <p className="text-xs text-gray-500 mt-2">• Pantau</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
              <h3 className="text-gray-400 text-sm mb-4">Debu</h3>
              <GaugeChart value={sensorData.particulate} max={100} color="text-green-400" unit="µg/m³" />
              <p className="text-xs text-gray-500 mt-2">• Perhatikan</p>
            </div>
          </div>
        </div>

        {/* Fan Control and Trend Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Fan Control */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Kontrol Kipas</h2>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-gray-400 text-sm">Mode Otomatis</span>
              <button
                onClick={() => setIsAutoMode(!isAutoMode)}
                className={`relative w-14 h-8 rounded-full transition-colors ${isAutoMode ? 'bg-blue-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${isAutoMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className="text-xs text-gray-500">{isAutoMode ? '🔒 Otomatis' : '🔓 Manual'}</span>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => !isAutoMode && setIsFanOn(true)}
                disabled={isAutoMode}
                className={`flex-1 py-2 rounded font-semibold transition-colors ${
                  isAutoMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : isFanOn
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Nyalakan
              </button>
              <button
                onClick={() => !isAutoMode && setIsFanOn(false)}
                disabled={isAutoMode}
                className={`flex-1 py-2 rounded font-semibold transition-colors ${
                  isAutoMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : !isFanOn
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Matikan
              </button>
            </div>
            <div className={`py-2 px-4 rounded-lg text-center font-semibold mb-2 ${isFanOn ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
              KIPAS: {isFanOn ? 'AKTIF' : 'MATI'}
            </div>
            <div className="text-xs text-gray-500 text-center">
              {isAutoMode ? '🔒 Mode Otomatis Aktif - Tombol ON/OFF Terkunci' : '🔓 Mode Manual - Anda dapat mengontrol kipas'}
            </div>
          </div>

          {/* Trend Graph */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Grafik Tren (Terakhir 1 Jam)</h2>
            <svg width="400" height="200" className="w-full border border-gray-700 rounded bg-gray-900/50">
              <line x1="30" y1="20" x2="30" y2="180" stroke="#374151" strokeWidth="1" />
              <line x1="30" y1="180" x2="380" y2="180" stroke="#374151" strokeWidth="1" />
              <text x="15" y="25" fontSize="10" fill="#9CA3AF" textAnchor="end">80</text>
              <text x="15" y="100" fontSize="10" fill="#9CA3AF" textAnchor="end">40</text>
              <text x="15" y="185" fontSize="10" fill="#9CA3AF" textAnchor="end">0</text>
              <text x="35" y="197" fontSize="10" fill="#9CA3AF">0</text>
              <text x="330" y="197" fontSize="10" fill="#9CA3AF">1000</text>
              <polyline
                points="35,120 50,115 65,125 80,110 95,130 110,105 125,135 140,100 155,140 160,110 175,145 190,95 205,150 220,90 235,155 250,85 265,160 280,80 295,165 310,75 325,170 340,70 355,175"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
              />
            </svg>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Gas Berbahaya (ppm)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-700 text-center text-xs text-gray-500">
          <p>&copy; 2025 Clairvo Team. Air Quality Monitoring System for Bengkel Harum Motor.</p>
        </footer>
      </main>
    </div>
  );
}
