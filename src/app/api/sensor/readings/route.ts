import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

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

export async function POST(request: NextRequest) {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    const { co2, particulate } = await request.json();

    // Get fan settings from Firestore
    const settingsSnap = await getDocs(query(collection(db, 'fan_settings'), limit(1)));
    const setting = settingsSnap.docs[0]?.data();

    let air_quality_status = 'AMAN';
    let fan_status = false;

    const threshold_co2_warning = setting?.fan_on_threshold_co2 || 150;
    const threshold_particulate_warning = setting?.fan_on_threshold_particulate || 50;
    const threshold_co2_danger = setting?.danger_threshold_co2 || 250;
    const threshold_particulate_danger = setting?.danger_threshold_particulate || 75;

    if (co2 > threshold_co2_danger || particulate > threshold_particulate_danger) {
      air_quality_status = 'BERBAHAYA';
    } else if (
      co2 > threshold_co2_warning ||
      particulate > threshold_particulate_warning
    ) {
      air_quality_status = 'WARNING';
    }

    if (setting?.is_auto_mode && air_quality_status !== 'AMAN') {
      fan_status = true;
    }

    const docRef = await addDoc(collection(db, 'sensor_readings'), {
      co2,
      particulate,
      air_quality_status,
      fan_status,
      created_at: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docRef.id,
          co2,
          particulate,
          air_quality_status,
          fan_status,
          created_at: new Date().toISOString(),
        },
        command: {
          fan_status: fan_status ? 1 : 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Sensor data error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan data sensor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const app = getFirebaseApp();
    const db = getFirestore(app);

    const querySnapshot = await getDocs(
      query(
        collection(db, 'sensor_readings'),
        orderBy('created_at', 'desc'),
        limit(100)
      )
    );

    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Gagal ambil data' },
      { status: 500 }
    );
  }
}
