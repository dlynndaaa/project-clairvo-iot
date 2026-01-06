// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVBeazojSe8p-y5lF3m1erFVECGihGPC8",
  authDomain: "project-iot-14988.firebaseapp.com",
  databaseURL: "https://project-iot-14988-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-iot-14988",
  storageBucket: "project-iot-14988.firebasestorage.app",
  messagingSenderId: "47065380086",
  appId: "1:47065380086:web:4b275b9d23cd17a39ae8d7",
  measurementId: "G-2DCC207NKW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);