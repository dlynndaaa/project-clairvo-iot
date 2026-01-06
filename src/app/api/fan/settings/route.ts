import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc, query, limit, getDocs } from 'firebase/firestore';

const getFirebaseApp = () => {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
};

const SETTINGS_DOC_ID = 'default';

export async function GET(request: NextRequest) {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    const docRef = doc(db, 'fan_settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create default settings if not exist
      const defaultSettings = {
        is_auto_mode: true,
        fan_on_threshold_co2: 150,
        fan_on_threshold_particulate: 50,
        danger_threshold_co2: 250,
        danger_threshold_particulate: 75,
        updated_at: new Date(),
      };
      await setDoc(docRef, defaultSettings);
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(docSnap.data());
  } catch (error) {
    console.error('Get fan settings error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil pengaturan kipas' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    const { is_auto_mode, fan_on_threshold_co2, fan_on_threshold_particulate, danger_threshold_co2, danger_threshold_particulate } =
      await request.json();

    const docRef = doc(db, 'fan_settings', SETTINGS_DOC_ID);
    const updateData = {
      is_auto_mode,
      fan_on_threshold_co2,
      fan_on_threshold_particulate,
      danger_threshold_co2,
      danger_threshold_particulate,
      updated_at: new Date(),
    };

    await setDoc(docRef, updateData, { merge: true });

    const updatedDoc = await getDoc(docRef);
    return NextResponse.json(updatedDoc.data());
  } catch (error) {
    console.error('Update fan settings error:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate pengaturan kipas' },
      { status: 500 }
    );
  }
}
