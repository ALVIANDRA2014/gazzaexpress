
export interface Shipment {
  id: string;
  awb: string;
  timestamp: any; // Firebase Timestamp
  waktu_teks: string;
  kurir: string;
  kategori: 'Dalam Kota' | 'Luar Kota';
  tujuan: string;
  pengirim: string;
  penerima: string;
  cod: number;
  kg: number;
  bersih: number;
  date_key?: string; // Derived helper
}

export interface IncomingDelivery {
  id: string;
  kurir: string;
  date_key: string;
  source: 'JAYA' | 'KDR'; // Bisa ditambah jika perlu
  total_cod: number;
  total_paket: number;
}

export type UserRole = 'admin' | 'kurir';

export interface User {
  name: string;
  role: UserRole;
}

export interface CourierProfile {
  id: string; // The zone ID, e.g., "Z4"
  fullName: string;
  phoneNumber: string;
  areaDescription: string;
  photoBase64?: string;
}

export const KECAMATAN_LIST = [
  "BAGOR", "BARON", "BERBEK", "GONDANG", "JATIKALEN", "KERTOSONO", 
  "LENGKONG", "LOCERET A", "LOCERET B", "NGANJUK", "NGETOS", "NGLUYU", 
  "NGRONGGOT", "PACE", "PATIANROWO A", "PATIANROWO B", "PRAMBON", 
  "REJOSO A", "REJOSO B", "SAWAHAN", "SUKOMORO", "TANJUNGANOM", "WILANGAN"
];

// Mapping Z-ID to Districts
export const ZONE_MAPPING: Record<string, string[]> = {
  "Z2": ["KERTOSONO", "PATIANROWO B", "JATIKALEN"],
  "Z-2": ["KERTOSONO", "PATIANROWO B", "JATIKALEN"],
  "Z3": ["NGRONGGOT", "PRAMBON"],
  "Z-3": ["NGRONGGOT", "PRAMBON"],
  "Z4": ["TANJUNGANOM"],
  "Z-4": ["TANJUNGANOM"],
  "Z5": ["BAGOR", "NGANJUK"],
  "Z-5": ["BAGOR", "NGANJUK"],
  "Z6": [], // Z6 Terdaftar agar muncul di dashboard, tapi area kosong (Khusus Pickup)
  "Z-6": [], 
  "Z7": ["PACE", "SUKOMORO"],
  "Z-7": ["PACE", "SUKOMORO"],
  "Z8": ["REJOSO A", "GONDANG", "NGLUYU"],
  "Z-8": ["REJOSO A", "GONDANG", "NGLUYU"],
  "Z9": ["WILANGAN", "SAWAHAN"],
  "Z-9": ["WILANGAN", "SAWAHAN"],
  "Z10": ["BERBEK", "LOCERET A", "NGETOS"],
  "Z-10": ["BERBEK", "LOCERET A", "NGETOS"],
  "Z11": ["REJOSO B", "LOCERET B"],
  "Z-11": ["REJOSO B", "LOCERET B"],
  "Z12": ["BARON", "PATIANROWO A", "LENGKONG"],
  "Z-12": ["BARON", "PATIANROWO A", "LENGKONG"]
};
