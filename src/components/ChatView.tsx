
import React, { useState, useMemo, useEffect } from 'react';
import { Shipment, User, ZONE_MAPPING, CourierProfile, IncomingDelivery } from '../types';
import { resetDatabase, deleteShipment } from '../services/shipmentService';
import { subscribeToCourierProfiles, updateCourierProfile } from '../services/courierService';
import { subscribeToIncomingDeliveries, updateIncomingDelivery } from '../services/deliveryService';
import { GlassCard, InputDark, ButtonRed } from './Shared';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';
import * as XLSX from 'xlsx';

interface AdminViewProps {
  user: User;
  data: Shipment[];
  onEdit: (shipment: Shipment) => void;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'recap' | 'finance' | 'cod_deposit' | 'data' | 'courier_mgmt';
type CourierDetailTab = 'pickup' | 'delivery';

const AdminView: React.FC<AdminViewProps> = ({ data, onEdit, onLogout }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null);
  const [courierSubTab, setCourierSubTab] = useState<CourierDetailTab>('pickup');
  const [profiles, setProfiles] = useState<CourierProfile[]>([]);
  const [incomingDeliveries, setIncomingDeliveries] = useState<IncomingDelivery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Profile Editor State
  const [editingProfile, setEditingProfile] = useState<Partial<CourierProfile>>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCourierProfiles(setProfiles);
    return () => unsub();
  }, []);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  useEffect(() => {
    const unsub = subscribeToIncomingDeliveries(selectedDate, setIncomingDeliveries);
    return () => unsub();
  }, [selectedDate]);

  const filteredDataByDate = useMemo(() => {
    return data.filter(d => d.date_key === selectedDate);
  }, [data, selectedDate]);

  const stats = useMemo(() => {
    const courierStats: Record<string, { pkt: number, kg: number, cod: number, bersih: number }> = {};
    const dateRecap: Record<string, { dk: number, lk: number, total: number }> = {};
    let totalPkt = 0;
    let totalBersih = 0;
    let totalCod = 0;

    // All time stats for Recap
    data.forEach(d => {
      const dateKey = d.date_key || 'UNKNOWN';
      if (!dateRecap[dateKey]) dateRecap[dateKey] = { dk: 0, lk: 0, total: 0 };
      if (d.kategori === 'Dalam Kota') dateRecap[dateKey].dk++; else dateRecap[dateKey].lk++;
      dateRecap[dateKey].total++;
    });

    // Selected Date stats for Dashboard & Finance
    filteredDataByDate.forEach(d => {
      const k = d.kurir ? d.kurir.toUpperCase() : 'UNKNOWN';
      if (!courierStats[k]) courierStats[k] = { pkt: 0, kg: 0, cod: 0, bersih: 0 };
      courierStats[k].pkt++;
      courierStats[k].kg += Number(d.kg) || 0;
      courierStats[k].cod += Number(d.cod) || 0;
      courierStats[k].bersih += Number(d.bersih) || 0;
      totalPkt++;
      totalBersih += Number(d.bersih) || 0;
      totalCod += Number(d.cod) || 0;
    });

    const chartData = Object.keys(dateRecap).sort().slice(-7).map(date => ({
      date,
      total: dateRecap[date].total
    }));

    // Financial Recap Specifics for 'recap' and 'finance' tabs
    const finance = {
        dk: filteredDataByDate.filter(d => d.kategori === 'Dalam Kota'),
        lk: filteredDataByDate.filter(d => d.kategori === 'Luar Kota')
    };
    
    const totalOngkir = filteredDataByDate.reduce((acc, curr) => {
        const rate = curr.kategori === 'Dalam Kota' ? 5000 : 12000;
        return acc + (curr.kg * rate);
    }, 0);

    return { courierStats, dateRecap, totalPkt, totalBersih, totalCod, chartData, finance, totalOngkir };
  }, [data, filteredDataByDate]);

  // Logic for COD Deposit Table
  const depositData = useMemo(() => {
    const couriers = Object.keys(ZONE_MAPPING).filter(k => !k.startsWith('Z-')); // Get base Z-IDs
    
    // Calculate Previous Day (H-1) Date Key
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

    return couriers.map(cId => {
       const courierName = cId; 
       
       // 1. PICKUP DATA (KEMARIN / H-1)
       const myPickupsHMin1 = data.filter(d => 
          d.date_key === prevDateKey && 
          d.kurir.toUpperCase() === courierName
       );
       
       const dkPickups = myPickupsHMin1.filter(d => d.kategori === 'Dalam Kota');
       const lkPickups = myPickupsHMin1.filter(d => d.kategori === 'Luar Kota');
       
       const pickupDKBersih = dkPickups.reduce((sum, d) => sum + (Number(d.bersih) || 0), 0);
       const pickupLKBersih = lkPickups.reduce((sum, d) => sum + (Number(d.bersih) || 0), 0);
       const totalPickupBersih = pickupDKBersih + pickupLKBersih;
       
       // 2. DELIVERY DATA
       // A. Delivery Dalam Kota (Otomatis berdasarkan Wilayah dari DATA KEMARIN / H-1)
       const cleanZone = cId.replace('-', '');
       const myAreas = ZONE_MAPPING[cleanZone] || [];
       
       const deliveriesHMin1 = data.filter(d => 
          d.date_key === prevDateKey && 
          myAreas.includes(d.tujuan.toUpperCase())
       );
       
       const deliveryDKCod = deliveriesHMin1.reduce((sum, d) => sum + (Number(d.cod) || 0), 0);

       // B. Delivery Luar Kota / Incoming (Manual Input Admin HARI INI - Saat Setoran)
       const deliveryJaya = incomingDeliveries.find(i => i.kurir === courierName && i.source === 'JAYA');
       const deliveryKdr = incomingDeliveries.find(i => i.kurir === courierName && i.source === 'KDR');

       const jayaCod = deliveryJaya?.total_cod || 0;
       const kdrCod = deliveryKdr?.total_cod || 0;
       
       const totalDelivery = deliveryDKCod + jayaCod + kdrCod;

       // Formula: Setoran = Total Delivery (DK H-1 + Manual Hari Ini) - Total Pickup Bersih (H-1)
       const grandTotal = totalDelivery - totalPickupBersih;

       return {
         id: cId,
         name: cId, 
         pickup: {
           dkCount: dkPickups.length,
           lkCount: lkPickups.length,
           dkBersih: pickupDKBersih,
           lkBersih: pickupLKBersih,
           totalBersih: totalPickupBersih
         },
         delivery: {
           dkCod: deliveryDKCod, 
           dkCount: deliveriesHMin1.length, 
           jayaCod,
           kdrCod,
           totalCod: totalDelivery
         },
         grandTotal
       };
    });
  }, [filteredDataByDate, incomingDeliveries, data, selectedDate]);

  // Handlers for Manual Input
  const handleUpdateIncoming = async (kurir: string, source: 'JAYA' | 'KDR', value: string) => {
    const numValue = Number(value.replace(/[^0-9]/g, ''));
    await updateIncomingDelivery({
      id: '', // Generated in service
      kurir,
      date_key: selectedDate,
      source,
      total_cod: numValue,
      total_paket: 0 
    });
  };

  const handleDeleteData = async (id: string, awb: string) => {
    if (window.confirm(`Yakin ingin menghapus data AWB: ${awb} ini secara permanen?`)) {
       try {
         await deleteShipment(id);
       } catch (error) {
         alert("Gagal menghapus data.");
       }
    }
  };

  // Data helpers for Selected Courier View
  const selectedCourierData = useMemo(() => {
    if (!selectedCourier) return { pickups: [], deliveries: [] };
    
    // Untuk monitoring dashboard harian, kita gunakan data tanggal terpilih (bukan H-1)
    // agar Admin bisa memantau pergerakan hari ini.
    const pickups = filteredDataByDate.filter(d => d.kurir.toUpperCase() === selectedCourier.toUpperCase());
    
    const cleanZone = selectedCourier.replace('-', '');
    const areas = ZONE_MAPPING[cleanZone] || ZONE_MAPPING[selectedCourier] || [];
    const deliveries = filteredDataByDate.filter(d => areas.includes(d.tujuan.toUpperCase()));

    return { pickups, deliveries };
  }, [selectedCourier, filteredDataByDate]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create an image element to load the file
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (readerEvent) => {
        img.src = readerEvent.target?.result as string;
        
        img.onload = () => {
          // Canvas for resizing
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300; // Resize to max width of 300px
          const scaleSize = MAX_WIDTH / img.width;
          
          // If image is smaller than limit, use original dimensions
          if (scaleSize >= 1) {
             setEditingProfile(prev => ({ ...prev, photoBase64: img.src }));
             return;
          }

          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Compress output to JPEG with 0.7 quality to reduce size
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setEditingProfile(prev => ({ ...prev, photoBase64: compressedBase64 }));
        };
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingProfile.id || !editingProfile.fullName) {
      alert("ID/Area dan Nama wajib diisi!");
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateCourierProfile(editingProfile as CourierProfile);
      alert("Profil kurir berhasil disimpan!");
      setEditingProfile({});
    } catch (err: any) {
      console.error(err);
      // Show explicit error message
      alert("Gagal memperbarui profil: " + (err.message || "Unknown Error. Cek koneksi atau ukuran foto."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Helper to format currency
    const fmtRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;

    // --- SHEET 1: REKAP LENGKAP (Custom Table) ---
    const couriers = Object.keys(ZONE_MAPPING)
        .filter(k => !k.startsWith('Z-'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    
    const targetDateKey = selectedDate;

    const reportRows: any[] = [];
    const totals = {
       pCodDk: 0, pCodLk: 0, pCodTot: 0,
       pKgDk: 0, pKgLk: 0, pKgTot: 0,
       pOngkir: 0, pBersih: 0,
       dDk: 0, dKg: 0, dJaya: 0, dKdr: 0, dTot: 0
    };

    couriers.forEach(cId => {
       // PICKUP DATA (H-0)
       const myPickups = data.filter(d => d.date_key === targetDateKey && d.kurir.toUpperCase() === cId);
       const dk = myPickups.filter(d => d.kategori === 'Dalam Kota');
       const lk = myPickups.filter(d => d.kategori === 'Luar Kota');

       const pCodDk = dk.reduce((a,b) => a + (Number(b.cod)||0), 0);
       const pCodLk = lk.reduce((a,b) => a + (Number(b.cod)||0), 0);
       const pCodTot = pCodDk + pCodLk;
       
       const pKgDk = dk.reduce((a,b) => a + (Number(b.kg)||0), 0);
       const pKgLk = lk.reduce((a,b) => a + (Number(b.kg)||0), 0);
       const pKgTot = pKgDk + pKgLk;

       const pBersihDk = dk.reduce((a,b) => a + (Number(b.bersih)||0), 0);
       const pBersihLk = lk.reduce((a,b) => a + (Number(b.bersih)||0), 0);
       const pBersih = pBersihDk + pBersihLk;
       const pOngkir = pCodTot - pBersih;

       // DELIVERY DATA (H-0)
       const cleanZone = cId.replace('-', '');
       const myAreas = ZONE_MAPPING[cleanZone] || [];
       const delDkData = data.filter(d => d.date_key === targetDateKey && myAreas.includes(d.tujuan.toUpperCase()));
       
       const dDk = delDkData.reduce((a,b) => a + (Number(b.cod)||0), 0);
       const dKg = delDkData.reduce((a,b) => a + (Number(b.kg)||0), 0);

       const incJaya = incomingDeliveries.find(i => i.kurir === cId && i.source === 'JAYA')?.total_cod || 0;
       const incKdr = incomingDeliveries.find(i => i.kurir === cId && i.source === 'KDR')?.total_cod || 0;
       const dTot = dDk + incJaya + incKdr;

       totals.pCodDk += pCodDk; totals.pCodLk += pCodLk; totals.pCodTot += pCodTot;
       totals.pKgDk += pKgDk; totals.pKgLk += pKgLk; totals.pKgTot += pKgTot;
       totals.pOngkir += pOngkir; totals.pBersih += pBersih;
       totals.dDk += dDk; totals.dKg += dKg; totals.dJaya += incJaya; totals.dKdr += incKdr; totals.dTot += dTot;

       reportRows.push([
           cId, 
           fmtRp(pCodDk), fmtRp(pCodLk), fmtRp(pCodTot), 
           pKgDk, pKgLk, pKgTot, 
           fmtRp(pOngkir), fmtRp(pBersih),
           "", 
           cId, fmtRp(dDk), dKg, fmtRp(incJaya), fmtRp(incKdr), fmtRp(dTot)
       ]);
    });

    const headerTitle = ["PICKUP", "", "", "", "", "", "", "", "", "", "DELIVERY", "", "", "", "", ""];
    const headerMain = ["NAMA", "PICKUP", "", "TOTAL", "KG", "", "TOTAL", "ONGKIR", "BERSIH", "", "NAMA", "DK", "KG", "JAYA", "KDR", "TOTAL"];
    const headerSub = ["", "DALAM", "LUAR", "", "DK", "LK", "", "", "", "", "", "", "", "", "", ""];
    const totalRow = [
        "TOTAL", 
        fmtRp(totals.pCodDk), fmtRp(totals.pCodLk), fmtRp(totals.pCodTot),
        totals.pKgDk, totals.pKgLk, totals.pKgTot,
        fmtRp(totals.pOngkir), fmtRp(totals.pBersih),
        "",
        "TOTAL", fmtRp(totals.dDk), totals.dKg, fmtRp(totals.dJaya), fmtRp(totals.dKdr), fmtRp(totals.dTot)
    ];

    const sheetData = [headerTitle, headerMain, headerSub, ...reportRows, totalRow];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!merges'] = [
        {s: {r:0, c:0}, e: {r:0, c:8}}, // PICKUP Title
        {s: {r:0, c:10}, e: {r:0, c:15}}, // DELIVERY Title
        {s: {r:1, c:0}, e: {r:2, c:0}}, // NAMA
        {s: {r:1, c:1}, e: {r:1, c:2}}, // PICKUP Header Span
        {s: {r:1, c:3}, e: {r:2, c:3}}, // TOTAL
        {s: {r:1, c:4}, e: {r:1, c:5}}, // KG Header Span
        {s: {r:1, c:6}, e: {r:2, c:6}}, // TOTAL KG
        {s: {r:1, c:7}, e: {r:2, c:7}}, // ONGKIR
        {s: {r:1, c:8}, e: {r:2, c:8}}, // BERSIH
        {s: {r:1, c:10}, e: {r:2, c:10}}, // NAMA Del
        {s: {r:1, c:11}, e: {r:2, c:11}}, // DK
        {s: {r:1, c:12}, e: {r:2, c:12}}, // KG
        {s: {r:1, c:13}, e: {r:2, c:13}}, // JAYA
        {s: {r:1, c:14}, e: {r:2, c:14}}, // KDR
        {s: {r:1, c:15}, e: {r:2, c:15}}, // TOTAL
    ];

    ws['!cols'] = [
        {wch: 10}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 8}, {wch: 8}, {wch: 8}, {wch: 15}, {wch: 15}, {wch: 5},
        {wch: 10}, {wch: 15}, {wch: 8}, {wch: 15}, {wch: 15}, {wch: 15}
    ];

    XLSX.utils.book_append_sheet(wb, ws, "REKAP LENGKAP");

    // --- SHEET 2: GABUNGAN (Split Table) ---
    const dkData = filteredDataByDate.filter(d => d.kategori === 'Dalam Kota');
    const lkData = filteredDataByDate.filter(d => d.kategori === 'Luar Kota');

    const maxRows = Math.max(dkData.length, lkData.length);
    const gabunganRows = [];

    // Header Rows
    const gabunganTitle = ["DATA DALAM KOTA", "", "", "", "", "", "", "DATA LUAR KOTA", "", "", "", "", ""];
    const gabunganHeader = [
        "ALAMAT/TUJUAN", "PENGIRIM", "PENERIMA", "COD", "KG", "KURIR",
        "", // Gap
        "ALAMAT/TUJUAN", "PENGIRIM", "PENERIMA", "COD", "KG", "KURIR"
    ];

    for (let i = 0; i < maxRows; i++) {
        const dk = dkData[i];
        const lk = lkData[i];

        const row = [
            // DK Side
            dk ? dk.tujuan : "",
            dk ? dk.pengirim : "",
            dk ? dk.penerima : "",
            dk ? fmtRp(Number(dk.cod) || 0) : "",
            dk ? (Number(dk.kg) || 0) : "",
            dk ? dk.kurir : "",
            "", // Gap Column
            // LK Side
            lk ? lk.tujuan : "",
            lk ? lk.pengirim : "",
            lk ? lk.penerima : "",
            lk ? fmtRp(Number(lk.cod) || 0) : "",
            lk ? (Number(lk.kg) || 0) : "",
            lk ? lk.kurir : ""
        ];
        gabunganRows.push(row);
    }

    const wsGabungan = XLSX.utils.aoa_to_sheet([gabunganTitle, gabunganHeader, ...gabunganRows]);

    // Merges for Title
    wsGabungan['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Merging "DATA DALAM KOTA"
        { s: { r: 0, c: 7 }, e: { r: 0, c: 12 } } // Merging "DATA LUAR KOTA"
    ];

    // Column Widths
    wsGabungan['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 5 }, { wch: 8 }, // DK
        { wch: 5 },  // Gap
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 5 }, { wch: 8 }  // LK
    ];

    XLSX.utils.book_append_sheet(wb, wsGabungan, "GABUNGAN");

    // --- SHEET 3: KEDIRI (LUAR KOTA yg mengandung kata KDR/KEDIRI) ---
    const kediriData = filteredDataByDate.filter(d => 
        d.kategori === 'Luar Kota' && 
        (d.tujuan.toUpperCase().includes('KDR') || d.tujuan.toUpperCase().includes('KEDIRI'))
    );

    const kediriSheetRows = kediriData.map((d, i) => ({
        "No": i + 1,
        "AWB": d.awb,
        "Waktu": d.waktu_teks,
        "Kurir Pickup": d.kurir,
        "Pengirim": d.pengirim,
        "Penerima": d.penerima,
        "Tujuan": d.tujuan,
        "Berat": d.kg,
        "COD": d.cod
    }));

    // Use dummy row if empty to prevent error
    const wsKediri = XLSX.utils.json_to_sheet(kediriSheetRows.length > 0 ? kediriSheetRows : [{ "Status": "Tidak ada data KDR/KEDIRI hari ini" }]);
    wsKediri['!cols'] = [{wch:5}, {wch:15}, {wch:20}, {wch:15}, {wch:20}, {wch:20}, {wch:20}, {wch:8}, {wch:12}];
    XLSX.utils.book_append_sheet(wb, wsKediri, "KEDIRI");

    // --- SHEET 4: JAYA (LUAR KOTA yg TIDAK mengandung kata KDR/KEDIRI) ---
    const jayaData = filteredDataByDate.filter(d => 
        d.kategori === 'Luar Kota' && 
        !(d.tujuan.toUpperCase().includes('KDR') || d.tujuan.toUpperCase().includes('KEDIRI'))
    );

    const jayaSheetRows = jayaData.map((d, i) => ({
        "No": i + 1,
        "AWB": d.awb,
        "Waktu": d.waktu_teks,
        "Kurir Pickup": d.kurir,
        "Pengirim": d.pengirim,
        "Penerima": d.penerima,
        "Tujuan": d.tujuan,
        "Berat": d.kg,
        "COD": d.cod
    }));

    const wsJaya = XLSX.utils.json_to_sheet(jayaSheetRows.length > 0 ? jayaSheetRows : [{ "Status": "Tidak ada data JAYA hari ini" }]);
    wsJaya['!cols'] = [{wch:5}, {wch:15}, {wch:20}, {wch:15}, {wch:20}, {wch:20}, {wch:20}, {wch:8}, {wch:12}];
    XLSX.utils.book_append_sheet(wb, wsJaya, "JAYA");


    // --- SHEET 5++: DATA MENTAH (Existing) ---
    const grouped: Record<string, any[]> = {};
    filteredDataByDate.forEach(d => {
      if (!grouped[d.kurir]) grouped[d.kurir] = [];
      grouped[d.kurir].push({
        "AWB": d.awb,
        "Waktu": d.waktu_teks,
        "Kurir": d.kurir,
        "Tujuan": d.tujuan,
        "Pengirim": d.pengirim,
        "Penerima": d.penerima,
        "COD": d.cod,
        "Kg": d.kg,
        "Bersih": d.bersih
      });
    });

    Object.keys(grouped).forEach(k => {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(grouped[k]), k.substring(0, 30));
    });

    XLSX.writeFile(wb, `GAZZA_REKAP_${selectedDate}.xlsx`);
  };

  const handleReset = async () => {
    if (window.confirm('🚨 RESET DATABASE? Data akan hilang permanen.')) {
      await resetDatabase();
      alert('Reset Berhasil.');
    }
  };

  const renderSidebar = () => (
    <div className="w-64 bg-[#0a0a0a] border-r border-white/5 h-screen fixed left-0 top-0 z-50 flex flex-col hidden lg:flex">
      <div className="p-8 border-b border-white/5 mb-4 text-center font-brand">
        <h2 className="font-black italic text-xl text-white uppercase">G<span className="text-red-600 text-3xl">E</span></h2>
        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Admin Control</p>
      </div>
      
      {[
        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'cod_deposit', icon: '💵', label: 'Laporan Uang COD' },
        { id: 'recap', icon: '📅', label: 'Rekap Harian' },
        { id: 'finance', icon: '💰', label: 'Keuangan' },
        { id: 'data', icon: '📋', label: 'Semua Data' },
        { id: 'courier_mgmt', icon: '👥', label: 'Data Kurir' },
      ].map(item => (
        <div 
          key={item.id}
          onClick={() => { setActiveTab(item.id as AdminTab); setSelectedCourier(null); }}
          className={`px-5 py-4 flex items-center gap-3 font-extrabold text-[10px] uppercase cursor-pointer border-l-[3px] transition ${activeTab === item.id ? 'text-white border-red-600 bg-red-600/10' : 'text-slate-500 border-transparent hover:text-white'}`}
        >
          <span>{item.icon}</span> {item.label}
        </div>
      ))}

      <div className="px-6 mt-10 space-y-3">
        <button onClick={handleDownloadExcel} className="w-full bg-emerald-900/20 text-emerald-500 border border-emerald-600/30 py-3 rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-emerald-900/30 transition italic tracking-widest">
          📥 Download Excel
        </button>
        <button onClick={handleReset} className="w-full bg-red-900/20 text-red-500 border border-red-900/30 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-red-900/30 transition italic tracking-widest">
          🚨 Reset Cloud
        </button>
      </div>

      <div className="mt-auto p-6 text-center">
        <button onClick={onLogout} className="text-[10px] font-black text-slate-600 uppercase hover:text-white italic transition">Logout System</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {renderSidebar()}
      
      <div className="flex-1 lg:ml-64 p-6 lg:p-10 transition-all">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Dashboard Operasional</h2>
            <h1 className="text-2xl font-brand font-black italic text-white uppercase tracking-tighter">
              {activeTab === 'courier_mgmt' ? 'MANAJEMEN INFO KURIR' : 
               activeTab === 'cod_deposit' ? 'LAPORAN SETORAN COD' :
               `DATA ${selectedDate}`}
            </h1>
          </div>
          {activeTab !== 'courier_mgmt' && activeTab !== 'data' && (
            <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-2xl border border-white/5">
               <span className="text-[8px] font-black text-slate-500 px-2">FILTER TANGGAL:</span>
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="bg-black text-white text-[10px] font-black uppercase border-none focus:ring-0 rounded-lg p-2 italic"
               />
            </div>
          )}
        </div>

        {/* 1. DASHBOARD MAIN */}
        {activeTab === 'dashboard' && !selectedCourier && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                 <GlassCard className="p-6 rounded-3xl h-64 flex flex-col justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={stats.chartData}>
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px'}} 
                          itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                        />
                        <Line type="monotone" dataKey="total" stroke="#e11d48" strokeWidth={3} dot={{r: 4, fill: '#e11d48'}} activeDot={{r: 6, fill: '#fff'}} />
                      </LineChart>
                    </ResponsiveContainer>
                 </GlassCard>
              </div>
              <GlassCard className="p-6 rounded-3xl flex flex-col justify-center gap-6">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paket Harian</p>
                    <p className="font-black text-4xl italic text-white tracking-tighter">{stats.totalPkt}</p>
                 </div>
                 <div className="border-t border-white/5 pt-6">
                    <p className="text-[9px] font-black text-red-600 uppercase tracking-widest italic font-bold">Net Profit Harian</p>
                    <p className="font-black text-3xl italic text-red-600 tracking-tighter">Rp {stats.totalBersih.toLocaleString()}</p>
                 </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(ZONE_MAPPING).filter(k => !k.startsWith('Z-')).map(courierName => {
                const courierData = stats.courierStats[courierName] || { pkt: 0, bersih: 0 };
                const p = profiles.find(pr => pr.id.toUpperCase() === courierName.toUpperCase());
                return (
                  <GlassCard 
                    key={courierName}
                    onClick={() => { setSelectedCourier(courierName); setCourierSubTab('pickup'); }}
                    className={`p-5 rounded-2xl transition cursor-pointer text-center uppercase font-black group relative overflow-hidden ${courierData.pkt > 0 ? 'border-red-600/30' : 'opacity-40 grayscale'}`}
                  >
                    <div className="flex justify-center mb-2">
                       {p?.photoBase64 ? (
                         <img src={p.photoBase64} className="w-10 h-10 rounded-full object-cover border-2 border-red-600/50" />
                       ) : (
                         <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-[10px] text-slate-600">👤</div>
                       )}
                    </div>
                    <div className="flex justify-between mb-2 relative z-10 items-center">
                      <span className="text-white text-[10px]">{p?.fullName || courierName}</span>
                      <span className="text-red-600 italic font-brand tracking-widest font-black text-[12px]">
                        {courierData.pkt} PKT
                      </span>
                    </div>
                    <div className="text-[10px] text-green-500 italic font-black tracking-widest relative z-10">
                      Rp {courierData.bersih.toLocaleString()}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. DASHBOARD - SELECTED COURIER DETAIL (RESTORED) */}
        {activeTab === 'dashboard' && selectedCourier && (
          <div className="animate-fade-in space-y-6">
            <button 
              onClick={() => setSelectedCourier(null)}
              className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-white transition italic"
            >
              ← Kembali ke Dashboard
            </button>
            
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-brand font-black text-white italic">{selectedCourier}</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Detail Operasional Harian</p>
              </div>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                 <button 
                   onClick={() => setCourierSubTab('pickup')}
                   className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition ${courierSubTab === 'pickup' ? 'bg-red-600 text-white' : 'text-slate-500'}`}
                 >
                   Pickup
                 </button>
                 <button 
                   onClick={() => setCourierSubTab('delivery')}
                   className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition ${courierSubTab === 'delivery' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
                 >
                   Delivery
                 </button>
              </div>
            </div>

            <GlassCard className="rounded-3xl overflow-hidden min-h-[400px]">
               {courierSubTab === 'pickup' ? (
                 <div className="p-6">
                    <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Daftar Pickup Hari Ini</h3>
                    {selectedCourierData.pickups.length === 0 ? (
                      <p className="text-center text-slate-600 italic text-xs py-10">Tidak ada data pickup</p>
                    ) : (
                      <div className="grid gap-3">
                         {selectedCourierData.pickups.map(d => (
                           <div key={d.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                              <div>
                                 <p className="text-white font-bold text-xs uppercase">{d.penerima}</p>
                                 <p className="text-[9px] text-slate-500 uppercase mt-1">{d.tujuan} • {d.kg} KG</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-green-500 font-black italic">Rp {d.cod.toLocaleString()}</p>
                                 <p className="text-[8px] text-slate-600 uppercase">Bersih: Rp {d.bersih.toLocaleString()}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="p-6">
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Daftar Delivery (Area {selectedCourier})</h3>
                    {selectedCourierData.deliveries.length === 0 ? (
                      <p className="text-center text-slate-600 italic text-xs py-10">Tidak ada data delivery</p>
                    ) : (
                      <div className="grid gap-3">
                         {selectedCourierData.deliveries.map(d => (
                           <div key={d.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                              <div>
                                 <p className="text-white font-bold text-xs uppercase">{d.penerima}</p>
                                 <p className="text-[9px] text-slate-500 uppercase mt-1">Dari: {d.pengirim}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-blue-500 font-black italic">Rp {d.cod.toLocaleString()}</p>
                                 <p className="text-[8px] text-slate-600 uppercase">{d.awb}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                    )}
                 </div>
               )}
            </GlassCard>
          </div>
        )}

        {/* 3. COD DEPOSIT TAB (EXISTING) */}
        {activeTab === 'cod_deposit' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex justify-between items-center bg-red-900/10 p-4 rounded-3xl border border-red-600/30">
               <div>
                  <h3 className="font-brand font-black text-white italic uppercase">Total Uang Setoran</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase italic">
                    (Delivery DK H-1 + Jaya + KDR) - Pickup Bersih H-1
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-3xl font-brand font-black text-red-600 italic tracking-tighter">
                     Rp {depositData.reduce((a, b) => a + b.grandTotal, 0).toLocaleString()}
                  </p>
               </div>
             </div>

             <GlassCard className="rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-[10px] min-w-[1200px]">
                      <thead className="bg-black text-slate-500 uppercase tracking-widest border-b border-white/10">
                         <tr>
                            <th className="p-4 bg-black/80 sticky left-0 z-20">Kurir</th>
                            <th className="p-4 text-center border-l border-white/5 bg-blue-900/10" colSpan={4}>DELIVERY (Dana Masuk)</th>
                            <th className="p-4 text-center border-l border-white/5 bg-yellow-900/10" colSpan={3}>PICKUP (Potongan/Bersih)</th>
                            <th className="p-4 text-right border-l border-white/5 bg-red-900/10">SETORAN</th>
                         </tr>
                         <tr className="text-[9px] text-slate-600">
                            <th className="p-2 bg-black/80 sticky left-0 z-20"></th>
                            <th className="p-2 text-center bg-blue-900/10 text-white">DK (H-1)</th>
                            <th className="p-2 text-center bg-blue-900/10 text-white">JAYA</th>
                            <th className="p-2 text-center bg-blue-900/10 text-white">KDR / LAIN</th>
                            <th className="p-2 text-center bg-blue-900/20 text-blue-500 font-black">Total Delivery</th>
                            <th className="p-2 text-center bg-yellow-900/10 text-white">DK (H-1)</th>
                            <th className="p-2 text-center bg-yellow-900/10 text-white">LK (H-1)</th>
                            <th className="p-2 text-center bg-yellow-900/20 text-yellow-500 font-black">Total Bersih</th>
                            <th className="p-2 text-right bg-red-900/10 text-white font-black">TOTAL</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {depositData.map((row) => (
                           <tr key={row.id} className="hover:bg-white/5 transition">
                              <td className="p-4 font-black text-white italic sticky left-0 bg-neutral-900/90 z-10 border-r border-white/5">
                                 {row.name}
                              </td>
                              
                              {/* Delivery Data */}
                              <td className="p-2 text-center bg-blue-900/5">
                                 <div className="font-bold text-slate-300">Rp {row.delivery.dkCod.toLocaleString()}</div>
                                 <div className="text-[8px] text-slate-600">{row.delivery.dkCount} Pkt</div>
                              </td>
                              <td className="p-2 text-center bg-blue-900/5">
                                 <input 
                                   type="text" 
                                   className="bg-black/40 border border-white/10 rounded w-20 text-center text-white text-[10px] p-1 focus:border-blue-500 focus:outline-none"
                                   placeholder="0"
                                   defaultValue={row.delivery.jayaCod || ''}
                                   onBlur={(e) => handleUpdateIncoming(row.name, 'JAYA', e.target.value)}
                                 />
                              </td>
                              <td className="p-2 text-center bg-blue-900/5">
                                 <input 
                                   type="text" 
                                   className="bg-black/40 border border-white/10 rounded w-20 text-center text-white text-[10px] p-1 focus:border-blue-500 focus:outline-none"
                                   placeholder="0"
                                   defaultValue={row.delivery.kdrCod || ''}
                                   onBlur={(e) => handleUpdateIncoming(row.name, 'KDR', e.target.value)}
                                 />
                              </td>
                              <td className="p-2 text-center bg-blue-900/10 font-black text-blue-500 border-r border-white/5 italic">
                                 Rp {row.delivery.totalCod.toLocaleString()}
                              </td>

                              {/* Pickup Data (Bersih) */}
                              <td className="p-2 text-center bg-yellow-900/5">
                                 <div className="font-bold text-slate-300">Rp {row.pickup.dkBersih.toLocaleString()}</div>
                                 <div className="text-[8px] text-slate-600">{row.pickup.dkCount} Pkt</div>
                              </td>
                              <td className="p-2 text-center bg-yellow-900/5">
                                 <div className="font-bold text-slate-300">Rp {row.pickup.lkBersih.toLocaleString()}</div>
                                 <div className="text-[8px] text-slate-600">{row.pickup.lkCount} Pkt</div>
                              </td>
                              <td className="p-2 text-center bg-yellow-900/10 border-l border-white/5 border-r">
                                 <span className="font-black text-yellow-500 italic">Rp {row.pickup.totalBersih.toLocaleString()}</span>
                              </td>

                              {/* Grand Total */}
                              <td className="p-4 text-right font-black text-red-500 text-xs italic bg-red-900/5 border-l border-white/5">
                                 Rp {row.grandTotal.toLocaleString()}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
