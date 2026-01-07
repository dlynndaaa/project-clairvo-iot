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
  co2: number;
  particulate: number;
  fan_status: boolean;
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
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return getDatabase(app);
  }, []);

  /* ================= STATE ================= */
  const [sensorData, setSensorData] = useState<SensorData>({
    co2: 0,
    particulate: 0,
    fan_status: false,
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

  /* ================= REALTIME FIREBASE LISTENER ================= */
  useEffect(() => {
    if (!db) return;

    console.log('🔥 Firebase Realtime Connected');

    /* === SENSOR DATA (REALTIME) === */
    const sensorRef = ref(db, 'sensor_readings/latest');
    const unsubSensor = onValue(
      sensorRef,
      (snap) => {
        const d = snap.val();
        if (d) {
          setSensorData({
            co2: Number(d.co2 ?? 0),
            particulate: Number(d.particulate ?? 0),
            fan_status: d.fan_status === true || d.fan_status === 'true',
          });
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Sensor listener error:', err);
        setIsLoading(false);
      }
    );

    /* === FAN SETTINGS (REALTIME) === */
    const settingsRef = ref(db, 'fan_settings');
    const unsubSettings = onValue(
      settingsRef,
      (snap) => {
        const d = snap.val();
        if (d && typeof d.is_auto_mode !== 'undefined') {
          setIsAutoMode(d.is_auto_mode === true || d.is_auto_mode === 'true');
        }
      },
      (err) => console.warn('Settings listener error:', err)
    );

    return () => {
      unsubSensor();
      unsubSettings();
    };
  }, [db]);

  /* ================= ACTIONS ================= */
  const toggleAutoMode = async () => {
    if (!db) return;
    await update(ref(db, 'fan_settings'), {
      is_auto_mode: !isAutoMode,
    });
  };

  const controlFanManual = async (status: boolean) => {
    if (!db || isAutoMode) return;
    await update(ref(db, 'sensor_readings/latest'), {
      fan_status: status,
    });
  };

  /* ================= LOADING ================= */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Menghubungkan ke Firebase (Realtime)...
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/clairvo-logo-white.png" alt="Logo" width={36} height={36} />
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
            <p className="text-gray-400 mb-2">CO₂</p>
            <p className="text-4xl font-bold text-yellow-400">
              {sensorData.co2} <span className="text-sm">ppm</span>
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
            <p className="text-gray-400 mb-2">Debu (PM)</p>
            <p className="text-4xl font-bold text-blue-400">
              {sensorData.particulate}{' '}
              <span className="text-sm">µg/m³</span>
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
              sensorData.fan_status
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            STATUS KIPAS: {sensorData.fan_status ? 'AKTIF 🌀' : 'MATI ⭕'}
          </div>
        </div>
      </main>
    </div>
  );
}
