import React from 'react';

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-neutral-900/90 backdrop-blur-xl border border-white/5 shadow-xl ${className}`}
  >
    {children}
  </div>
);

export const InputDark: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ className = '', label, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">{label}</label>}
    <input 
      {...props}
      className={`w-full bg-[#111] border border-[#333] text-white text-center uppercase p-3 rounded-xl text-sm transition focus:border-red-600 focus:shadow-[0_0_15px_rgba(225,29,72,0.2)] focus:outline-none placeholder-slate-600 ${className}`}
    />
  </div>
);

export const SelectDark: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...props }) => (
  <select 
    {...props}
    className={`w-full bg-[#111] border border-[#333] text-white text-center uppercase p-3 rounded-xl text-sm transition focus:border-red-600 focus:outline-none cursor-pointer ${className}`}
  >
    {children}
  </select>
);

export const ButtonRed: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...props }) => (
  <button 
    {...props}
    className={`bg-red-600 text-white font-black uppercase rounded-xl transition hover:bg-red-500 shadow-lg shadow-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);
