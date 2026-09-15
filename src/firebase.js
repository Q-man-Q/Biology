import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc,
  writeBatch 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAhQChfSv5nE0oV9T5IyEbTh1ce_hK0Jlk",
  authDomain: "ebita-28de9.firebaseapp.com",
  projectId: "ebita-28de9",
  storageBucket: "ebita-28de9.firebasestorage.app",
  messagingSenderId: "1062616040220",
  appId: "1:1062616040220:web:509e74744fe3977338f0d9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize background seamless anonymous authentication
export function initAnonymousAuth(onUser) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch((err) => {
        console.error("Anonymous authentication error:", err);
      });
    } else {
      if (onUser) onUser(user);
    }
  });
}

// Get current user UID
export function getCurrentUserUid() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

// Helper to remove 'undefined' values which cause Firestore setDoc errors
export function cleanForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  const cleaned = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  }
  return cleaned;
}

// Collection references
export const OBS_COLLECTION = "observations";
export const SETTINGS_COLLECTION = "settings";

// Realtime observations listener
export function subscribeToObservations(onUpdate, onError) {
  const obsRef = collection(db, OBS_COLLECTION);
  return onSnapshot(
    obsRef,
    (snapshot) => {
      const list = [];
      snapshot.forEach((document) => {
        list.push(document.data());
      });
      // Sort newest first
      list.sort((a, b) => {
        const timeA = `${a.date || ''} ${a.time || ''}`;
        const timeB = `${b.date || ''} ${b.time || ''}`;
        return timeB.localeCompare(timeA);
      });
      onUpdate(list);
    },
    (err) => {
      console.error("Firestore observations error:", err);
      if (onError) onError(err);
    }
  );
}

// Save or update an observation in Firestore
export async function saveObservationToCloud(obsObj) {
  if (!obsObj.id) return;
  try {
    const userUid = getCurrentUserUid();
    const payload = {
      ...obsObj,
      authorUid: obsObj.authorUid || userUid || 'anonymous'
    };
    const docRef = doc(db, OBS_COLLECTION, String(obsObj.id));
    const cleaned = cleanForFirestore(payload);
    await setDoc(docRef, cleaned, { merge: true });
    console.log("Successfully saved observation to Firestore Cloud:", obsObj.id);
  } catch (err) {
    console.error("Error saving observation to Firestore:", err);
    throw err;
  }
}

// Delete an observation from Firestore
export async function deleteObservationFromCloud(obsId) {
  if (!obsId) return;
  try {
    const docRef = doc(db, OBS_COLLECTION, String(obsId));
    await deleteDoc(docRef);
    console.log("Successfully deleted observation from Firestore Cloud:", obsId);
  } catch (err) {
    console.error("Error deleting observation from Firestore:", err);
    throw err;
  }
}

// Batch replace all observations
export async function batchSaveObservationsToCloud(obsArray) {
  if (!Array.isArray(obsArray)) return;
  try {
    const userUid = getCurrentUserUid();
    const batch = writeBatch(db);
    obsArray.forEach((obs) => {
      if (obs.id) {
        const payload = {
          ...obs,
          authorUid: obs.authorUid || userUid || 'anonymous'
        };
        const docRef = doc(db, OBS_COLLECTION, String(obs.id));
        const cleaned = cleanForFirestore(payload);
        batch.set(docRef, cleaned, { merge: true });
      }
    });
    await batch.commit();
    console.log(`Successfully batch-saved ${obsArray.length} observations to Firestore Cloud`);
  } catch (err) {
    console.error("Error batch saving observations to Firestore:", err);
    throw err;
  }
}

// Realtime reserve points listener
export function subscribeToReservePoints(onUpdate) {
  const pointsDocRef = doc(db, SETTINGS_COLLECTION, "reserve_points");
  return onSnapshot(
    pointsDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      }
    },
    (err) => {
      console.warn("Firestore reserve points error:", err);
    }
  );
}

// Save reserve points to cloud
export async function saveReservePointsToCloud(pointsData) {
  try {
    const pointsDocRef = doc(db, SETTINGS_COLLECTION, "reserve_points");
    const cleaned = cleanForFirestore(pointsData);
    await setDoc(pointsDocRef, cleaned, { merge: true });
  } catch (err) {
    console.error("Error saving reserve points to Firestore:", err);
  }
}
