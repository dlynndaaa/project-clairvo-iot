import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial data
        const sendData = async () => {
          try {
            const app = getFirebaseApp();
            const db = getFirestore(app);

            const querySnapshot = await getDocs(
              query(
                collection(db, 'sensor_readings'),
                orderBy('created_at', 'desc'),
                limit(1)
              )
            );

            if (querySnapshot.docs.length > 0) {
              const data = {
                id: querySnapshot.docs[0].id,
                ...querySnapshot.docs[0].data(),
              };
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify(data)}\n\n`
                )
              );
            }
          } catch (error) {
            console.error('Error fetching sensor data:', error);
          }
        };

        // Send data every 1 second
        const interval = setInterval(sendData, 1000);

        // Cleanup when client disconnects
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });

        // Send data first time
        await sendData();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return NextResponse.json(
      { error: 'Gagal membuka stream' },
      { status: 500 }
    );
  }
}
