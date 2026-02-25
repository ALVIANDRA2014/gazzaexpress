import React, { useState, useEffect } from 'react';
import { Shipment, KECAMATAN_LIST } from '../types';
import { updateShipment } from '../services/shipmentService';
import { GlassCard, InputDark, ButtonRed, SelectDark } from './Shared';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, shipment }) => {
  const [formData, setFormData] = useState<Partial<Shipment>>({});
  const [isDalamKota, setIsDalamKota] = useState(true);

  useEffect(() => {
    if (shipment) {
      setFormData({
        pengirim: shipment.pengirim,
        penerima: shipment.penerima,
        tujuan: shipment.tujuan,
        cod: shipment.cod,
        kg: shipment.kg,
        kategori: shipment.kategori
      });
      setIsDalamKota(shipment.kategori === 'Dalam Kota');
    }
  }, [shipment]);

  if (!isOpen || !shipment) return null;

  const handleSave = async () => {
    if (!formData.pengirim || !formData.penerima || !formData.tujuan) return alert("Data incomplete");
    
    const rate = formData.kategori === 'Dalam Kota' ? 5000 : 12000;
    const kg = Number(formData.kg) || 0;
    const cod = Number(formData.cod) || 0;
    const bersih = cod - (kg * rate);

    try {
      await updateShipment(shipment.id, {
        ...formData,
        kg,
        cod,
        bersih
      });
      onClose();
    } catch (e) {
      alert("Failed to update");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg p-8 rounded-3xl border-t-4 border-red-600">
        <h3 className="font-black text-xl mb-6 italic text-white uppercase text-center font-brand">Edit Data</h3>
        
        <div className="space-y-4">
          <InputDark 
            value={formData.pengirim || ''} 
            onChange={e => setFormData({...formData, pengirim: e.target.value.toUpperCase()})}
            placeholder="PENGIRIM"
          />
          <InputDark 
            value={formData.penerima || ''} 
            onChange={e => setFormData({...formData, penerima: e.target.value.toUpperCase()})}
            placeholder="PENERIMA"
          />
          
          {isDalamKota ? (
             <SelectDark
               value={formData.tujuan || ''}
               onChange={e => setFormData({...formData, tujuan: e.target.value})}
             >
               <option value="" disabled>PILIH KECAMATAN</option>
               {KECAMATAN_LIST.map(k => <option key={k} value={k}>{k}</option>)}
             </SelectDark>
          ) : (
            <InputDark 
              value={formData.tujuan || ''} 
              onChange={e => setFormData({...formData, tujuan: e.target.value.toUpperCase()})}
              placeholder="KOTA TUJUAN"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <InputDark 
              type="number" 
              value={formData.cod || 0} 
              onChange={e => setFormData({...formData, cod: Number(e.target.value)})}
              placeholder="COD"
              label="COD (Rp)"
            />
            <InputDark 
              type="number" 
              value={formData.kg || 0} 
              onChange={e => setFormData({...formData, kg: Number(e.target.value)})}
              placeholder="KG"
              label="Berat (Kg)"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              onClick={onClose} 
              className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold text-[10px] uppercase hover:bg-white/10 transition"
            >
              Batal
            </button>
            <ButtonRed onClick={handleSave} className="flex-1 py-3 text-[10px]">
              Simpan
            </ButtonRed>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default EditModal;
