import React, { useState } from 'react';
import { GlassCard, ButtonRed } from './Shared';

const WhatsAppChat: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    `Selamat siang kak \nKami dari *GAZZA EXPRESS* \nMau antar paket bisa serlokasi atau ancer" rumah 🏡 untuk memudahkan pengantaran paketnya 🙏 \nBila mau keluar rumah bisa tinggalkan uang COD ditempat yang aman dan bisa dijangkau kurir atau transfer \nUntuk jamnya gak bisa dipastikan (karena kita jalan sesuai rute) \nOngkir nganjuk 5000/kg \nLuar kota 12.000/kg \nTerimakasih atas pengertiannya kak 🙏`
  );

  const handleOpenWA = () => {
    // Bersihkan nomor dari karakter non-angka
    let cleaned = phone.replace(/\D/g, '');
    
    // Jika dimulai dengan 0, ubah ke 62
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    // Jika tidak diawali 62 dan digit cukup panjang, tambahkan 62 (asumsi Indonesia)
    if (!cleaned.startsWith('62') && cleaned.length >= 9) {
      cleaned = '62' + cleaned;
    }

    if (cleaned.length < 10) {
      alert("Nomor telepon tidak valid!");
      return;
    }

    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${cleaned}?text=${encodedMsg}`, '_blank');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Ambil angka saja jika ada teks lain yang terikut
      const numbersOnly = text.replace(/\D/g, '');
      setPhone(numbersOnly);
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  return (
    <div className="max-w-md mx-auto animate-fade-in px-2 pb-10">
      <div className="text-center mb-6">
        <h3 className="font-brand font-black italic text-2xl text-white uppercase tracking-tighter">
          GAZZA <span className="text-red-600 underline decoration-white/10 underline-offset-8">CHAT</span>
        </h3>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-3 italic">
          Broadcast Messenger System
        </p>
      </div>

      <GlassCard className="p-6 rounded-[2.5rem] border-t-4 border-red-600 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-5">
          {/* Input Nomor */}
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase italic mb-2 block tracking-widest">Nomor HP Penerima</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <span className="text-xs font-black text-red-600 italic">+62</span>
                <div className="w-[1px] h-4 bg-white/10"></div>
              </div>
              <input 
                type="tel"
                placeholder="812-xxxx-xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-black/60 border border-white/5 text-white p-4 pl-16 rounded-2xl text-lg font-brand italic focus:border-red-600 focus:outline-none transition-all placeholder:text-slate-800"
              />
            </div>
          </div>

          {/* Input Pesan */}
          <div>
            <label className="text-[8px] font-black text-slate-500 uppercase italic mb-2 block tracking-widest">Isi Pesan Otomatis</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/60 border border-white/5 text-white p-4 rounded-2xl text-[11px] font-bold italic leading-relaxed focus:border-red-600 focus:outline-none transition-all h-40 resize-none custom-scrollbar"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handlePaste}
              className="flex-1 bg-white/5 border border-white/5 text-[9px] font-black uppercase text-slate-400 py-4 rounded-2xl hover:bg-white/10 transition italic"
            >
              📋 Tempel Nomor
            </button>
            <button 
              onClick={() => { setPhone(''); setMessage(`Selamat siang kak \nKami dari *GAZZA EXPRESS* \nMau antar paket bisa serlokasi atau ancer" rumah 🏡 untuk memudahkan pengantaran paketnya 🙏 \nBila mau keluar rumah bisa tinggalkan uang COD ditempat yang aman dan bisa dijangkau kurir atau transfer \nUntuk jamnya gak bisa dipastikan (karena kita jalan sesuai rute) \nOngkir nganjuk 5000/kg \nLuar kota 12.000/kg \nTerimakasih atas pengertiannya kak 🙏`); }}
              className="px-6 bg-white/5 border border-white/5 text-[9px] font-black uppercase text-slate-400 py-4 rounded-2xl hover:bg-red-900/20 hover:text-red-500 transition italic"
            >
              🔄 Reset
            </button>
          </div>

          <ButtonRed 
            onClick={handleOpenWA}
            className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 group"
          >
            <span className="font-brand italic font-black text-sm tracking-widest uppercase">Kirim Pesan Sekarang</span>
            <span className="group-hover:translate-x-1 transition-transform">🚀</span>
          </ButtonRed>

          <p className="text-[7px] text-center text-slate-700 font-bold uppercase italic tracking-tighter leading-relaxed">
            Kontak tidak akan tersimpan di buku telepon Anda.
          </p>
        </div>
      </GlassCard>

      <div className="mt-8 text-center opacity-20">
        <h4 className="font-brand font-black italic text-[10px] text-white uppercase">GAZZA EXPRESS CHAT</h4>
        <p className="text-[7px] font-bold text-slate-500 uppercase mt-1">SOP Delivery Version 1.0</p>
      </div>
    </div>
  );
};

export default WhatsAppChat;
