import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCVBeazojSe8p-y5lF3m1erFVECGihGPC8",
  authDomain: "project-iot-14988.firebaseapp.com",
  databaseURL: "https://project-iot-14988-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-iot-14988",
  storageBucket: "project-iot-14988.appspot.com",
  messagingSenderId: "47065380086",
  appId: "1:47065380086:web:4b275b9d23cd17a39ae8d7",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const database = getDatabase(app);
