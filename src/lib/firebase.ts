import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyBTd3twtLaUDuyM6V_I2YqZBTdpC9nyXGM",
  authDomain: "tarrif-56dbb.firebaseapp.com",
  projectId: "tarrif-56dbb",
  storageBucket: "tarrif-56dbb.firebasestorage.app",
  messagingSenderId: "930839657762",
  appId: "1:930839657762:web:07b54f53d140548de6397b",
  measurementId: "G-9VMS5V9NTY"
};



export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);


if (typeof window !== 'undefined') {
  void isSupported().then((supported) => {
    if (supported) getAnalytics(firebaseApp);
  });
}



