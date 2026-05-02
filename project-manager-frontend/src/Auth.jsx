import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [expertise, setExpertise] = useState('Frontend');
  const [error, setError] = useState('');
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, role, expertise);
      }
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl font-serif shadow-sm">
            T
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {isLogin ? 'Sign in to Task Manager' : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-md border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email address</label>
              <input 
                type="email" 
                required 
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                required 
                className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            {!isLogin && (
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                  <select 
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm bg-white sm:text-sm" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="MEMBER">Team Member</option>
                    <option value="ADMIN">Project Admin</option>
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Expertise</label>
                  <select 
                    className="block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm bg-white sm:text-sm" 
                    value={expertise} 
                    onChange={(e) => setExpertise(e.target.value)}
                  >
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Fullstack">Fullstack</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              {isLogin ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="w-full text-center text-sm text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};