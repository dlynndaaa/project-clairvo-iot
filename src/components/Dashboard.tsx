'use client';

import { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const db = useMemo(() => {
    if (typeof window !== 'undefined') {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      return getDatabase(app);
    }
    return null;
  }, []);

  const [sensorData, setSensorData] = useState({
    gas: 0,
    dust: 0,
    fan: false,
  });
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    // 1. SESUAI GAMBAR: Path-nya adalah 'sensor/latest'
    const sensorRef = ref(db, 'sensor/latest');
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          gas: Number(data.gas || 0),
          dust: Number(data.dust || 0),
          fan: !!data.fan,
        });
      }
      setIsLoading(false);
    });

    // 2. SESUAI GAMBAR: Path-nya adalah 'fan_settings'
    const settingsRef = ref(db, 'fan_settings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setIsAutoMode(data.is_auto_mode);
    });

    return () => {
      unsubscribeSensor();
      unsubscribeSettings();
    };
  }, [db]);

  const toggleAutoMode = async () => {
    if (!db) return;
    try {
      await update(ref(db, 'fan_settings'), { is_auto_mode: !isAutoMode });
    } catch (e) { console.error(e); }
  };

  const controlFanManual = async (status: boolean) => {
    if (!db || isAutoMode) return;
    try {
      // Mengupdate status kipas langsung di path sensor/latest
      await update(ref(db, 'sensor/latest'), { fan: status });
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Firebase...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between mb-10">
          <h1 className="text-2xl font-bold">Harum Motor Dashboard</h1>
          <button onClick={onLogout} className="bg-red-500 px-4 py-2 rounded">Logout</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400 mb-2">Gas (CO)</p>
            <p className="text-4xl font-bold text-yellow-400">{sensorData.gas} <span className="text-sm">ppm</span></p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400 mb-2">Dust (PM2.5)</p>
            <p className="text-4xl font-bold text-blue-400">{sensorData.dust} <span className="text-sm">µg/m³</span></p>
          </div>
        </div>

        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold">Kontrol Kipas</h3>
              <p className="text-sm text-gray-400">Mode: {isAutoMode ? 'Otomatis' : 'Manual'}</p>
            </div>
            <button onClick={toggleAutoMode} className={`px-6 py-2 rounded-full font-bold ${isAutoMode ? 'bg-blue-600' : 'bg-gray-600'}`}>
              {isAutoMode ? 'AUTO ON' : 'MANUAL MODE'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => controlFanManual(true)} disabled={isAutoMode} className="bg-green-600 disabled:opacity-30 p-4 rounded-xl font-bold">NYALAKAN</button>
            <button onClick={() => controlFanManual(false)} disabled={isAutoMode} className="bg-gray-700 disabled:opacity-30 p-4 rounded-xl font-bold">MATIKAN</button>
          </div>

          <div className={`mt-6 p-4 text-center rounded-lg font-black border ${sensorData.fan ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-red-500 text-red-500 bg-red-500/10'}`}>
            STATUS KIPAS: {sensorData.fan ? 'AKTIF' : 'MATI'}
          </div>
        </div>
      </div>
    </div>
  );
}