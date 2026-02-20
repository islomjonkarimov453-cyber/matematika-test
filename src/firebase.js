import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Bazani ulash uchun kerak

const firebaseConfig = {
    apiKey: "AIzaSyDavfnh4Iv4Y2QQnS9_56q5TC8NOaZwsl0",
    authDomain: "matematika-onlayn-777.firebaseapp.com",
    databaseURL: "https://matematika-onlayn-777-default-rtdb.firebaseio.com",
    projectId: "matematika-onlayn-777",
    storageBucket: "matematika-onlayn-777.firebasestorage.app",
    messagingSenderId: "326361727081",
    appId: "1:326361727081:web:9fc2c3db6a3190f89c22f8"
};

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);

// Bazani eksport qilish (App.jsx ishlata olishi uchun)
export const db = getDatabase(app);