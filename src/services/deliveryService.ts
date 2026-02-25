
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { IncomingDelivery } from '../types';

const COLLECTION_NAME = 'incoming_deliveries';

export const subscribeToIncomingDeliveries = (dateKey: string, callback: (data: IncomingDelivery[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('date_key', '==', dateKey));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncomingDelivery));
    callback(data);
  });
};

export const subscribeToAllIncomingDeliveries = (callback: (data: IncomingDelivery[]) => void) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IncomingDelivery));
      callback(data);
    });
  };

export const updateIncomingDelivery = async (delivery: IncomingDelivery) => {
  // ID format: DATE_COURIER_SOURCE (e.g., 2023-10-27_Z4_JAYA) to ensure uniqueness per day
  const id = `${delivery.date_key}_${delivery.kurir}_${delivery.source}`.replace(/\s/g, '');
  const ref = doc(db, COLLECTION_NAME, id);
  await setDoc(ref, { ...delivery, id }, { merge: true });
};
