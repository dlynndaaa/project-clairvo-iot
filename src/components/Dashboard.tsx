'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, update } from 'firebase/database';

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

/* ================= TYPE ================= */
interface SensorData {
  gas: number;
  dust: number;
  fan: boolean;
  created_at?: string;
}

export default function Dashboard({
  user,
  onLogout,
}: {
  user: any;
  onLogout: () => void;
}) {
  /* ================= INIT FIREBASE (SAFE) ================= */
  const db = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      return getDatabase(app);
    } catch (err) {
      console.error('Firebase init error:', err);
      return null;
    }
  }, []);

  /* ================= STATE ================= */
  const [sensorData, setSensorData] = useState<SensorData>({
    gas: 0,
    dust: 0,
    fan: false,
  });

  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  /* ================= CLOCK ================= */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB'
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  /* ================= FIREBASE LISTENER ================= */
  useEffect(() => {
    if (!db) return;

    console.log('🔥 Firebase connected');

    /* SENSOR DATA → sensor/latest */
    const sensorRef = ref(db, 'sensor/latest');
    const unsubSensor = onValue(
      sensorRef,
      (snap) => {
        const d = snap.val();
        if (d) {
          setSensorData({
            gas: Number(d.gas ?? 0),
            dust: Number(d.dust ?? 0),
            fan: d.fan === true || d.fan === 'true',
            created_at: d.created_at,
          });
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Sensor read error:', err);
        setIsLoading(false);
      }
    );

    /* FAN SETTINGS → fan_settings */
    const settingsRef = ref(db, 'fan_settings');
    const unsubSettings = onValue(
      settingsRef,
      (snap) => {
        const d = snap.val();
        if (d && typeof d.is_auto_mode !== 'undefined') {
          setIsAutoMode(d.is_auto_mode === true || d.is_auto_mode === 'true');
        }
      },
      (err) => console.warn('Settings read error:', err)
    );

    return () => {
      unsubSensor();
      unsubSettings();
    };
  }, [db]);

  /* ================= ACTIONS ================= */
  const toggleAutoMode = async () => {
    if (!db) return;
    try {
      await update(ref(db, 'fan_settings'), {
        is_auto_mode: !isAutoMode,
      });
    } catch (e) {
      console.error('Update auto mode failed:', e);
    }
  };

  const controlFanManual = async (status: boolean) => {
    if (!db || isAutoMode) return;
    try {
      await update(ref(db, 'sensor/latest'), {
        fan: status,
      });
    } catch (e) {
      console.error('Manual fan control failed:', e);
    }
  };

  /* ================= UI STATE ================= */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Menghubungkan ke Firebase...
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-900 font-sans text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/clairvo-logo-white.png"
              alt="Logo"
              width={36}
              height={36}
            />
            <h1 className="font-bold text-lg">
              Dashboard Monitoring – Bengkel Harum Motor
            </h1>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <p className="text-sm text-gray-400 mb-6">Realtime: {currentTime}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400 mb-2">Gas (CO)</p>
            <p className="text-4xl font-bold text-yellow-400">
              {sensorData.gas} <span className="text-sm">ppm</span>
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400 mb-2">Debu (PM2.5)</p>
            <p className="text-4xl font-bold text-blue-400">
              {sensorData.dust} <span className="text-sm">µg/m³</span>
            </p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-semibold">Kontrol Kipas</p>
              <p className="text-xs text-gray-400">
                Mode: {isAutoMode ? 'Otomatis' : 'Manual'}
              </p>
            </div>
            <button
              onClick={toggleAutoMode}
              className={`px-5 py-2 rounded-full font-bold ${
                isAutoMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              {isAutoMode ? 'AUTO' : 'MANUAL'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              disabled={isAutoMode}
              onClick={() => controlFanManual(true)}
              className="bg-green-600 disabled:opacity-30 py-3 rounded font-bold"
            >
              NYALAKAN
            </button>
            <button
              disabled={isAutoMode}
              onClick={() => controlFanManual(false)}
              className="bg-gray-600 disabled:opacity-30 py-3 rounded font-bold"
            >
              MATIKAN
            </button>
          </div>

          <div
            className={`mt-4 text-center font-bold py-3 rounded ${
              sensorData.fan
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            STATUS KIPAS: {sensorData.fan ? 'AKTIF 🌀' : 'MATI ⭕'}
          </div>
        </div>
      </main>
    </div>
  );
}
