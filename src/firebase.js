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
      console.warn("Firestore observations error:", err);
      if (onError) onError(err);
    }
  );
}

// Save or update an observation in Firestore
export async function saveObservationToCloud(obsObj) {
  if (!obsObj.id) return;
  try {
    const docRef = doc(db, OBS_COLLECTION, String(obsObj.id));
    await setDoc(docRef, obsObj, { merge: true });
  } catch (err) {
    console.error("Error saving observation to Firestore:", err);
  }
}

// Delete an observation from Firestore
export async function deleteObservationFromCloud(obsId) {
  if (!obsId) return;
  try {
    const docRef = doc(db, OBS_COLLECTION, String(obsId));
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error deleting observation from Firestore:", err);
  }
}

// Batch replace all observations
export async function batchSaveObservationsToCloud(obsArray) {
  if (!Array.isArray(obsArray)) return;
  try {
    const batch = writeBatch(db);
    obsArray.forEach((obs) => {
      if (obs.id) {
        const docRef = doc(db, OBS_COLLECTION, String(obs.id));
        batch.set(docRef, obs, { merge: true });
      }
    });
    await batch.commit();
  } catch (err) {
    console.error("Error batch saving observations to Firestore:", err);
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
    await setDoc(pointsDocRef, pointsData, { merge: true });
  } catch (err) {
    console.error("Error saving reserve points to Firestore:", err);
  }
}
