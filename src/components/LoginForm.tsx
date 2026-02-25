import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { GlassCard, InputDark, ButtonRed } from './Shared';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('kurir');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    if (role === 'admin') {
      if (password === '12345') {
        onLogin({ name: 'ADMIN', role: 'admin' });
      } else {
        alert('Password Admin Salah!');
      }
    } else {
      if (username.trim()) {
        onLogin({ name: username.trim().toUpperCase(), role: 'kurir' });
      } else {
        alert('ID Kurir Wajib Diisi!');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed">
      <GlassCard className="p-10 rounded-3xl w-full max-w-md shadow-2xl border-t-4 border-red-600">
        <div className="text-center mb-10">
          <h1 className="font-brand text-4xl font-black text-white tracking-tighter uppercase italic">
            GAZZA <span className="text-red-600">EXPRESS</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-2 italic tracking-tighter">
            Always Fast
          </p>
        </div>

        <div className="flex justify-around mb-8 border-b border-white/5 pb-2">
          <button 
            onClick={() => setRole('kurir')}
            className={`text-xs uppercase pb-2 font-brand italic font-bold transition-all ${role === 'kurir' ? 'border-b-2 border-red-600 text-white' : 'text-slate-500'}`}
          >
            Kurir
          </button>
          <button 
            onClick={() => setRole('admin')}
            className={`text-xs uppercase pb-2 font-brand italic font-bold transition-all ${role === 'admin' ? 'border-b-2 border-red-600 text-white' : 'text-slate-500'}`}
          >
            Admin
          </button>
        </div>

        <div className="space-y-4">
          {role === 'kurir' && (
            <InputDark 
              placeholder="ID KURIR / AREA"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="p-4 font-bold tracking-widest"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          )}
          
          <InputDark 
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="p-4 tracking-widest"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          
          <ButtonRed onClick={handleSubmit} className="w-full py-4 tracking-widest">
            Masuk
          </ButtonRed>

          <p className="text-[10px] font-bold text-slate-600 uppercase italic mt-8 border-t border-white/5 pt-4 text-center tracking-widest">
            Design aplikasi by ARIE-Z4 (Ported)
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default LoginForm;
