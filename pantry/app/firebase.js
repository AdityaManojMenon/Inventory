// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCipPB0beYhG8nhWMPvGy_7EFFRGPri-Qs",
  authDomain: "item-inventory-f958d.firebaseapp.com",
  projectId: "item-inventory-f958d",
  storageBucket: "item-inventory-f958d.appspot.com",
  messagingSenderId: "211547162603",
  appId: "1:211547162603:web:7a2564d81af978affafbae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const firestore = getFirestore(app);

export { firestore };