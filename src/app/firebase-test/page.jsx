"use client";

import { useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

export default function FirebaseTest() {
  useEffect(() => {
    async function test() {
      try {
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const app =
          getApps().length === 0
            ? initializeApp(firebaseConfig)
            : getApps()[0];

        const db = getFirestore(app);

        await addDoc(collection(db, "connection_test"), {
          status: "connected",
          time: new Date(),
        });

        console.log("🔥 FIREBASE TERHUBUNG");
      } catch (err) {
        console.error("❌ FIREBASE GAGAL", err);
      }
    }

    test();
  }, []);

  return <h1>Cek Firebase – buka Console</h1>;
}
