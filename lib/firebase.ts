import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCcfnDiyKWbleXSBxkvoLLWdA_iuaBQcUM",
  authDomain: "prft-native.firebaseapp.com",
  projectId: "prft-native",
  storageBucket: "prft-native.firebasestorage.app",
  messagingSenderId: "354762692638",
  appId: "1:354762692638:web:3c20e2ec1484094744760f",
  measurementId: "G-76QP4YLE8B"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
