import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Users, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from './AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ==========================================
// SUB-COMPONENTS (For cleaner render logic)
// ==========================================
const ProjectSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100" />
      <div className="h-5 bg-slate-200 rounded-md w-1/2" />
    </div>
    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
      <div className="h-4 bg-slate-100 rounded-md w-1/3" />
      <div className="h-4 bg-slate-100 rounded-md w-1/4" />
    </div>
  </div>
);

export const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- STATE ---
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // ==========================================
  // EFFECTS
  // ==========================================
  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/projects`);
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    try {
      await axios.post(`${API_URL}/api/projects`, { name: newProjectName });
      
      // Reset form & refresh
      setNewProjectName('');
      setIsCreating(false);
      fetchProjects(); 
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const renderCreateForm = () => (
    <form 
      onSubmit={handleCreateProject} 
      className="mb-8 bg-white p-5 rounded-2xl border border-indigo-200 shadow-md flex gap-4 items-center animate-in fade-in slide-in-from-top-4"
    >
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <FolderKanban size={20} />
      </div>
      <input 
        autoFocus
        type="text" 
        placeholder="Enter new project name..." 
        className="flex-1 px-2 py-2 border-none text-sm font-medium text-slate-900 focus:outline-none bg-transparent placeholder-slate-400"
        value={newProjectName} 
        onChange={(e) => setNewProjectName(e.target.value)}
      />
      <div className="flex gap-2 shrink-0">
        <button 
          type="button" 
          onClick={() => setIsCreating(false)} 
          className="text-sm text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all"
        >
          Create Project
        </button>
      </div>
    </form>
  );

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Projects</h1>
          {user?.role === 'MEMBER' ? (
            <p className="text-sm text-slate-500 mt-1">
              Filtering open tasks for your expertise: <span className="font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md ml-1">{user?.expertise}</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">System Administrator Overview</p>
          )}
        </div>
        
        {/* ADMIN: New Project Button */}
        {user?.role === 'ADMIN' && !isCreating && (
          <button 
            onClick={() => setIsCreating(true)} 
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} /> Create Project
          </button>
        )}
      </div>

      {/* CREATE FORM */}
      {isCreating && renderCreateForm()}

      {/* PROJECTS GRID */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectSkeleton />
          <ProjectSkeleton />
          <ProjectSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No active projects</h3>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'ADMIN' ? 'Create a new project to get started.' : 'Waiting for an administrator to create a project.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(project => (
            <div 
              key={project.id} 
              onClick={() => navigate(`/board/${project.id}`)} 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <FolderKanban size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">
                    {project.name}
                  </h3>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <Users size={16} className="text-slate-400" />
                  <span>{project._count?.tasks || 0} Total Tasks</span>
                </div>
                <div className="flex items-center gap-1 text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  Open Board <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};