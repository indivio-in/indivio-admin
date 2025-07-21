
const firebaseConfig = {
  apiKey: "AIzaSyCbrxD4VMsBXHxt34U8Fmb21830tdHalno",
  authDomain: "indivio-school.firebaseapp.com",
  projectId: "indivio-school",
  storageBucket: "indivio-school.appspot.com", // <-- FIXED
  messagingSenderId: "682492015693",
  appId: "1:682492015693:web:98f6b91d518364db2b9804"
};

// --- Firebase Service Initialization ---
// These variables will be globally available to other scripts that are loaded after this one.
let db, auth, storage;

try {
  // Initialize the Firebase app with your configuration
  const app = firebase.initializeApp(firebaseConfig);
  
  // Get references to the services you will use
  db = firebase.firestore();      // For the database (Firestore)
  auth = firebase.auth();         // For user authentication
  storage = firebase.storage();   // For file uploads (like school logos)
  
  console.info("Firebase Services Initialized Successfully.");
  
} catch (error) {
  console.error("Firebase Initialization Failed:", error);
  // If connection fails, show a prominent error message on the screen.
  document.body.innerHTML = '<h1>Error: Could not connect to Firebase. Check console and firebase-config.js.</h1>';
}