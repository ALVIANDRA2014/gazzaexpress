
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Shipment } from '../types';

const COLLECTION_NAME = 'shipments';

export const subscribeToShipments = (callback: (data: Shipment[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => {
      const d = doc.data();
      let dk = 'UNKNOWN';
      
      // Handle local date key generation safely
      if (d.timestamp && d.timestamp.toDate) {
        const dateObj = d.timestamp.toDate();
        // Format as YYYY-MM-DD in local time
        dk = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      } else {
        const now = new Date();
        dk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      }
      
      return { 
        id: doc.id, 
        ...d,
        date_key: dk
      } as Shipment;
    });
    callback(data);
  }, (error) => {
    console.error("Error fetching shipments:", error);
  });
};

export const addShipment = async (data: Omit<Shipment, 'id' | 'timestamp' | 'awb' | 'waktu_teks'>) => {
  try {
    const awb = "GEX" + Date.now().toString().slice(-6);
    const now = new Date();
    
    await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      awb,
      timestamp: serverTimestamp(),
      waktu_teks: now.toLocaleString('id-ID'),
    });
  } catch (error) {
    console.error("Error adding shipment:", error);
    throw error;
  }
};

export const updateShipment = async (id: string, data: Partial<Shipment>) => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, data);
  } catch (error) {
    console.error("Error updating shipment:", error);
    throw error;
  }
};

export const deleteShipment = async (id: string) => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
  } catch (error) {
    console.error("Error deleting shipment:", error);
    throw error;
  }
};

export const resetDatabase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
};
