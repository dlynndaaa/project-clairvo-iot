"use client";

import { useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

export default function FirebaseTest() {
  useEffect(() => {
    async function test() {
      try {
        const firebaseConfig = {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
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
