
import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';

interface LoginPortalProps {
  onLogin: () => void;
}

const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => onLogin(), 1200);
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex items-center justify-center p-6 relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,#e2e8f0_0%,transparent_50%)] opacity-40 pointer-events-none" />
      
      <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-500">
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl shadow-blue-900/5">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
              <span className="font-black text-white text-2xl tracking-tighter">A</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">AmpCon</h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Unified Infrastructure Controller</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account ID</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  defaultValue="admin@ampcon.io"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Token</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  defaultValue="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 mt-4 disabled:opacity-50"
            >
              {loading ? "Initializing..." : <>Launch Platform <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
            AmpCon Unified Security v2.5
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPortal;
