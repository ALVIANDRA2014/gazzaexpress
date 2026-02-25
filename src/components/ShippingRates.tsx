import React, { useState, useMemo } from 'react';
import { GlassCard, InputDark } from './Shared';

const ShippingRates: React.FC = () => {
  const [kg, setKg] = useState('');
  const [type, setType] = useState<'dk' | 'lk'>('dk');
  const [search, setSearch] = useState('');

  // Rate Data Structures
  const dalamKota = {
    standard: [
      "BAGOR", "BARON", "BERBEK", "GONDANG", "JATIKALEN", 
      "KERTOSONO", "LENGKONG", "LOCERET", "NGANJUK", 
      "NGRONGGOT", "PACE", "PATIANROWO", "PRAMBON", "REJOSO", "SUKOMORO", "TANJUNGANOM"
    ],
    special: [
      { name: "WILANGAN", price: 6000, est: "1-2 HARI" },
      { name: "SAWAHAN", price: 6000, est: "2-3 HARI" },
      { name: "NGETOS", price: 6000, est: "2-3 HARI" },
      { name: "NGLUYU", price: 6000, est: "2-3 HARI" }
    ],
    notCovered: [
      { area: "GONDANG", desas: ["LOSARI"] },
      { area: "SAWAHAN", desas: ["BARENG", "MARGOPATUT", "NGLIMAN"] },
      { area: "NGETOS", desas: ["KEPEL", "KWEDEN"] },
      { area: "NGLUYU", desas: ["BAJANG"] }
    ]
  };

  const luarKota = [
    { city: "JOMBANG", price: 12000, est: "2-3 HARI", not: [] },
    { city: "MOJOKERTO", price: 12000, est: "2-3 HARI", not: [] },
    { city: "SURABAYA", price: 12000, est: "2-3 HARI", not: ["KARANG PILANG"] },
    { city: "SIDOARJO", price: 12000, est: "2-3 HARI", not: ["KRIAN", "TAMAN"] },
    { city: "KEDIRI", price: 12000, est: "2-3 HARI", not: ["MOJO", "KANDANGAN"] },
    { city: "TUBAN", price: 12000, est: "2-3 HARI", not: ["BANGILAN", "JATIROGO", "KENDURAN", "PARENGAN", "RENGEL", "SENORI", "SINGGAHAN", "SOKO"] },
    { city: "TULUNGAGUNG", price: 12000, est: "2-3 HARI", not: [] },
    { city: "BLITAR", price: 12000, est: "2-3 HARI", not: ["PANGGUNG REJO"] },
    { city: "MALANG", price: 12000, est: "2-3 HARI", not: ["AMPELGADING", "BANTUR", "DAMPIT", "DONOMULYO", "GEDANGAN", "KALIPARE", "PAGAK", "SUMAWE", "TIRTOYUDO", "SUMBERMANJING"] },
    { city: "LAMONGAN", price: 12000, est: "2-3 HARI", not: ["MANTUP", "SAMBENG", "NGIMBANG", "SUKORAME", "BLULUK", "MODO"] },
    { city: "TRENGGALEK", price: 12000, est: "2-3 HARI", not: ["GADOR", "PINGIT", "BUKIT BAYON", "JAJAR", "PAKEL", "PLAPAR", "KRECEK", "GADING", "WATUAGUNG", "NGRANDU"] }
  ];

  const filteredLK = useMemo(() => {
    return luarKota.filter(l => l.city.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const filteredDKStandard = useMemo(() => {
    return dalamKota.standard.filter(s => s.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const currentRate = type === 'dk' ? 5000 : 12000;
  const calcTotal = (Number(kg) || 0) * currentRate;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Tab Switcher & Header */}
      <div className="text-center space-y-4">
        <h3 className="font-brand font-black italic text-xl uppercase text-white tracking-widest">Layanan Ongkir</h3>
        
        <div className="flex justify-center p-1 bg-black/40 rounded-2xl border border-white/5 max-w-sm mx-auto">
          <button 
            onClick={() => setType('dk')}
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${type === 'dk' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Nganjuk (DK)
          </button>
          <button 
            onClick={() => setType('lk')}
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${type === 'lk' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Luar Kota (LK)
          </button>
        </div>
      </div>

      {/* Quick Calculator Card */}
      <div className="max-w-md mx-auto">
        <GlassCard className="p-6 rounded-[2.5rem] border-t-2 border-white/10 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase italic">Kalkulator Cepat</span>
            <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase ${type === 'dk' ? 'bg-red-600/20 text-red-500' : 'bg-blue-600/20 text-blue-500'}`}>
              Tarif: Rp {currentRate.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex-1">
               <InputDark 
                 type="number" 
                 placeholder="MASUKKAN BERAT (KG)" 
                 value={kg} 
                 onChange={e => setKg(e.target.value)}
                 className="!bg-white/5 !border-white/5 !py-4 text-xl italic font-brand"
               />
             </div>
             <div className="text-right">
               <p className="text-[8px] font-black text-slate-500 uppercase italic">Total Ongkir</p>
               <p className={`text-2xl font-black font-brand italic ${type === 'dk' ? 'text-red-600' : 'text-blue-500'}`}>
                 Rp {calcTotal.toLocaleString()}
               </p>
             </div>
          </div>
        </GlassCard>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <InputDark 
          placeholder="Cari Kecamatan atau Kota..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="!rounded-full !py-3 !text-[11px]"
        />
      </div>

      {/* Results Display */}
      {type === 'dk' ? (
        <div className="space-y-6 animate-slide-up">
          {/* DK Standard (5k) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredDKStandard.map(name => (
              <div key={name} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition group">
                <span className="text-[10px] font-black text-white italic tracking-tighter uppercase mb-1">{name}</span>
                <span className="text-[9px] font-bold text-red-500 italic">Rp 5.000</span>
              </div>
            ))}
          </div>

          {/* DK Special (6k) */}
          {search === '' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dalamKota.special.map(item => (
                <GlassCard key={item.name} className="p-5 rounded-3xl flex justify-between items-center border-l-4 border-yellow-500/50">
                  <div>
                    <h4 className="font-brand font-black italic text-sm text-white">{item.name}</h4>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{item.est}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black font-brand text-yellow-500 italic">Rp {item.price.toLocaleString()}</p>
                    <p className="text-[7px] text-slate-600 font-black uppercase">Area Khusus</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Not Covered (Exceptions) */}
          <div className="pt-4">
            <h5 className="text-[10px] font-black text-red-600 uppercase italic mb-4 tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
              DAFTAR AREA TIDAK BISA (NOT COVERED)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dalamKota.notCovered.map(item => (
                <div key={item.area} className="bg-red-900/10 border border-red-900/20 p-4 rounded-2xl">
                  <p className="text-[9px] font-black text-red-500 uppercase mb-2 italic">KECAMATAN: {item.area}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.desas.map(d => (
                      <span key={d} className="bg-black/40 text-[8px] font-bold text-slate-400 px-2 py-1 rounded-md uppercase tracking-tight">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Luar Kota Results */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
          {filteredLK.map(item => (
            <GlassCard key={item.city} className="p-6 rounded-[2rem] border-t border-white/5 hover:border-blue-500/30 transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-brand font-black italic text-lg text-white tracking-tighter">{item.city}</h4>
                  <p className="text-[8px] font-black text-blue-500 uppercase italic tracking-widest">{item.est}</p>
                </div>
                <div className="text-right">
                   <p className="text-xl font-black font-brand text-white italic">Rp {item.price.toLocaleString()}</p>
                   <span className="text-[8px] bg-green-500/20 text-green-500 px-2 py-1 rounded-full font-black uppercase">Tercover</span>
                </div>
              </div>
              
              {item.not.length > 0 && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[7px] font-black text-red-500 uppercase mb-2 italic">⚠️ Tidak Bisa:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.not.map(n => (
                      <span key={n} className="text-[8px] text-slate-500 font-bold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
          {filteredLK.length === 0 && (
            <div className="col-span-full py-10 text-center">
              <p className="text-xs font-black text-slate-600 uppercase italic tracking-widest">Kota tidak ditemukan dalam sistem</p>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center pt-10 pb-20 border-t border-white/5">
         <p className="text-[9px] font-black text-slate-500 uppercase italic tracking-widest">Customer Service Logistik</p>
         <p className="text-lg font-brand font-black text-white italic mt-1 tracking-tighter">0856-0682-2892</p>
         <p className="text-[8px] text-slate-700 uppercase mt-4 italic">Update System: 10 Desember 2025</p>
      </div>
    </div>
  );
};

export default ShippingRates;
