import React, { useState, useEffect } from 'react';
import { User, Shipment } from './types';
import { subscribeToShipments } from './services/shipmentService';
import LoginForm from './components/LoginForm';
import CourierView from './components/CourierView';
import AdminView from './components/AdminView';
import EditModal from './components/EditModal';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Shipment[]>([]);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);

  // Subscribe to real-time updates when user is logged in
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToShipments((fetchedData) => {
        setData(fetchedData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setData([]);
  };

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0] pb-10">
      {/* Top Bar for Courier (Admin has sidebar) */}
      {user.role === 'kurir' && (
        <nav className="sticky top-0 z-40 bg-black/50 backdrop-blur-md border-b border-white/5 p-4 mb-8">
           <div className="max-w-7xl mx-auto flex justify-between items-center">
              <h2 className="font-black text-[10px] uppercase tracking-widest text-white italic font-brand">OPERATIONAL</h2>
              <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black uppercase text-slate-400 bg-white/5 px-4 py-2 rounded-full border border-white/10 italic tracking-widest">
                    {user.name}
                  </span>
                  <button onClick={handleLogout} className="text-[9px] font-black text-red-600 transition hover:text-white uppercase">
                    Logout
                  </button>
              </div>
           </div>
        </nav>
      )}

      <div className={user.role === 'kurir' ? "max-w-7xl mx-auto px-4" : ""}>
        {user.role === 'kurir' ? (
          <CourierView user={user} data={data} onEdit={setEditingShipment} />
        ) : (
          <AdminView 
             user={user} 
             data={data} 
             onEdit={setEditingShipment} 
             onLogout={handleLogout}
          />
        )}
      </div>

      <EditModal 
        isOpen={!!editingShipment} 
        onClose={() => setEditingShipment(null)} 
        shipment={editingShipment} 
      />
    </div>
  );
}

export default App;
