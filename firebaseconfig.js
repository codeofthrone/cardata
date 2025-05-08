import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Use the direct config values instead of environment variables
const firebaseConfig = {
  apiKey: "AIzaSyB2pm-3FYDBp5EWYju_trv6wQGYjPZEJwo",
  authDomain: "cardata-17759.firebaseapp.com",
  projectId: "cardata-17759",
  storageBucket: "cardata-17759.appspot.com", // Note: Fixed the storage bucket URL
  messagingSenderId: "344330794379",
  appId: "1:344330794379:web:ee3a7093fd9fb1b490eb8e",
  measurementId: "G-YR5NF4L3BW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);