
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { CourierProfile } from '../types';

const COLLECTION_NAME = 'courier_profiles';

export const subscribeToCourierProfiles = (callback: (profiles: CourierProfile[]) => void) => {
  return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id, // Explicitly use document ID to ensure list key validity
      ...doc.data()
    } as CourierProfile));
    callback(data);
  });
};

export const updateCourierProfile = async (profile: CourierProfile) => {
  if (!profile.id) throw new Error("ID Kurir wajib diisi");
  const ref = doc(db, COLLECTION_NAME, profile.id.toUpperCase());
  // Save specific fields to avoid overwriting id with undefined if passed incorrectly
  await setDoc(ref, {
    id: profile.id.toUpperCase(),
    fullName: profile.fullName || '',
    areaDescription: profile.areaDescription || '',
    phoneNumber: profile.phoneNumber || '',
    photoBase64: profile.photoBase64 || ''
  }, { merge: true });
};

export const getCourierProfile = async (id: string) => {
  const ref = doc(db, COLLECTION_NAME, id.toUpperCase());
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CourierProfile) : null;
};
