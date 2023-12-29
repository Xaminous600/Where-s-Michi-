// Import the functions you need from the SDKs you need
// Have to do ts-ignore as getReactNativePersistence is not detected by ts compiler with firebase 10.3.0
// @ts-ignore 
import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore';
import {initializeAuth, getReactNativePersistence} from 'firebase/auth';
import {getStorage, ref, uploadBytesResumable, uploadBytes} from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {getPerformance} from 'firebase/performance';

const firebaseConfig = {
  apiKey: "AIzaSyAozjCSYISlkP-mLiKk7r8zYmYgVZYIP-g",
  authDomain: "tfg-56e1b.firebaseapp.com",
  projectId: "tfg-56e1b",
  storageBucket: "tfg-56e1b.appspot.com",
  messagingSenderId: "54892743273",
  appId: "1:54892743273:web:007c4c189f1aac863330f8",
  measurementId: "G-6MFC6P2BV3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const perf = getPerformance(app);

initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export default app;
/*export const FIRESTORE_DB = getFirestore(FIREBASE_APP); 
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);*/