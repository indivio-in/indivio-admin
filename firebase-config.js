
const firebaseConfig = {
  apiKey: "AIzaSyCbrxD4VMsBXHxt34U8Fmb21830tdHalno",
  authDomain: "indivio-school.firebaseapp.com",
  projectId: "indivio-school",
  storageBucket: "indivio-school.appspot.com", // <-- FIXED
  messagingSenderId: "682492015693",
  appId: "1:682492015693:web:98f6b91d518364db2b9804"
};


// --- Firebase Service Initialization ---
let db, auth, storage;

try {
  const app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
  console.info("Firebase Services Initialized Successfully.");
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
  document.body.innerHTML = '<h1>Error: Could not connect to Firebase. Check console and firebase-config.js.</h1>';
}