import React, { useEffect, useState } from 'react';
import { FolderKanban, LogOut, Bell, PartyPopper } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [broadcast, setBroadcast] = useState(null);

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/broadcast`);
        setBroadcast(res.data);
      } catch (err) {
        // Silently fail if no broadcast exists
      }
    };

    fetchBroadcast();
    const interval = setInterval(fetchBroadcast, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between z-10">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold mr-3 font-serif">
              T
            </div>
            <span className="font-bold text-lg tracking-tight">Task Manager</span>
          </div>
          
          <nav className="p-4 space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 mt-2 px-3">
              Menu
            </div>
            <Link 
              to="/projects" 
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                location.pathname.includes('/projects') 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FolderKanban size={18} /> Projects
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={logout} 
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {broadcast && broadcast.assignee && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-sm shrink-0">
            <PartyPopper size={16} className="text-yellow-300" />
            <span>
              Awesome work! <strong>{broadcast.assignee.email?.split('@')[0] || 'User'}</strong> ({broadcast.assignee.expertise}) just completed <strong>"{broadcast.title}"</strong> in {broadcast.project?.name}!
            </span>
          </div>
        )}

        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={18} />
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-700 flex justify-center items-center rounded-full font-bold text-sm uppercase">
                {user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight text-slate-800">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
                <span className={`text-[10px] leading-tight font-bold tracking-wider uppercase mt-0.5 ${
                  user?.role === 'ADMIN' ? 'text-purple-600' : 'text-slate-500'
                }`}>
                  {user?.role} • {user?.expertise}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};