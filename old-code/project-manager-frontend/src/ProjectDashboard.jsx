import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { useAuth } from './AuthContext';
import { TaskCard } from './components/TaskCard';
import { BoardSkeleton } from './components/BoardSkeleton';

// ==========================================
// CONSTANTS & CONFIGURATION
// ==========================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const COLUMNS = ['Open Tasks', 'Staging', 'Assigned', 'Completed'];

const PRIORITY_WEIGHTS = { 
  HIGH: 3, 
  MEDIUM: 2, 
  LOW: 1 
};

const COLUMN_COLORS = {
  'Open Tasks': 'bg-blue-500',
  'Staging': 'bg-purple-500',
  'Assigned': 'bg-amber-500',
  'Completed': 'bg-emerald-500'
};

export const ProjectDashboard = () => {
  const { projectId } = useParams();
  const { user } = useAuth(); 
  
  // --- STATE ---
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToColumn, setAddingToColumn] = useState(null); 
  
  // --- FORM STATE ---
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('LOW');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // ==========================================
  // EFFECTS (Real-time Polling)
  // ==========================================
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/projects/${projectId}/tasks`);
        setTasks(res.data);
      } catch (err) { 
        console.error('Failed to fetch board data:', err); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchBoard();
    const interval = setInterval(fetchBoard, 3000);
    
    return () => clearInterval(interval);
  }, [projectId]);

  // ==========================================
  // DERIVED STATE (Smart Filtering & Sorting)
  // ==========================================
  const visibleTasks = tasks
    .filter((task) => {
      // Admins see everything
      if (user?.role === 'ADMIN') return true;
      // Members see all tasks in Open/Staging to bid on them
      if (task.status === 'Open Tasks' || task.status === 'Staging') return true;
      // Members ONLY see Assigned/Completed tasks if they own them
      return task.assigneeId === user?.id;
    })
    .sort((a, b) => PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority]); 

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    
    if (activeTask && activeTask.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex(t => t.id === active.id);
        const newIndex = items.findIndex(t => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });

      // Persist new status/order to backend
      axios.patch(`${API_URL}/api/tasks/reorder`, {
        taskId: active.id, 
        newStatus: over.id, 
        newOrder: 1 
      }).catch(err => console.error("Sync failed", err));
    }
  };

  const handleAddTask = async (e, status) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/api/tasks`, { 
        title: newTaskTitle, 
        priority: newTaskPriority, 
        projectId, 
        dueDate: newTaskDueDate || null 
      });

      setTasks(prev => [...prev, res.data]);
      
      // Reset Form
      setAddingToColumn(null); 
      setNewTaskTitle(''); 
      setNewTaskPriority('LOW'); 
      setNewTaskDueDate('');
    } catch (err) { 
      console.error("Failed to add task", err); 
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handleWorkflowAction = async (action, taskId, extraData = {}) => {
    let payload = { ...extraData };
    
    // Handle specific prompts based on action
    if (action === 'propose') {
      const approach = window.prompt("What is your approach to solving this task?");
      if (!approach) return; 
      payload.approach = approach;
    } else if (action === 'submit-work') {
      const remarks = window.prompt("Add any completion remarks for the Admin:");
      if (!remarks) return; 
      payload.remarks = remarks;
    }

    try {
      const res = await axios.patch(`${API_URL}/api/tasks/${taskId}/${action}`, payload);
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      console.error(`Failed to execute workflow action: ${action}`, err);
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  
  // Extracted Add Task Form for readability
  const renderAddTaskForm = (col) => (
    <form 
      onSubmit={(e) => handleAddTask(e, col)} 
      className="mt-3 p-4 bg-white rounded-lg border border-indigo-300 shadow-md flex flex-col gap-3 animate-in fade-in zoom-in-95"
    >
      <input 
        autoFocus 
        type="text" 
        placeholder="Task title..." 
        className="w-full text-sm font-medium text-slate-900 border-none focus:outline-none bg-transparent placeholder-slate-400" 
        value={newTaskTitle} 
        onChange={e => setNewTaskTitle(e.target.value)} 
      />
      
      <div className="flex gap-2">
        <input 
          type="date" 
          className="text-xs bg-slate-50 text-slate-700 rounded-md px-2.5 py-1.5 outline-none border border-slate-200 w-full" 
          value={newTaskDueDate} 
          onChange={e => setNewTaskDueDate(e.target.value)} 
        />
        <select 
          value={newTaskPriority} 
          onChange={e => setNewTaskPriority(e.target.value)} 
          className="text-xs bg-slate-50 text-slate-700 rounded-md px-2.5 py-1.5 outline-none border border-slate-200"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button 
          type="button" 
          onClick={() => setAddingToColumn(null)} 
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-md shadow-sm transition-colors"
        >
          Save Task
        </button>
      </div>
    </form>
  );

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Workflow</h1>
        <p className="text-slate-500 mt-1">High priority tasks are sorted to the top.</p>
      </div>
      
      {loading ? (
        <BoardSkeleton />
      ) : (
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full pb-8">
            
            {COLUMNS.map(col => (
              <div 
                key={col} 
                id={col} 
                className="w-full bg-slate-50/80 rounded-2xl p-5 border border-slate-200 shadow-sm min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-5 px-1 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${COLUMN_COLORS[col] || 'bg-gray-500'}`} />
                    <h3 className="font-bold text-base text-slate-800">{col}</h3>
                  </div>
                  <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">
                    {visibleTasks.filter(t => t.status === col).length}
                  </span>
                </div>
                
                {/* Draggable Task List */}
                <SortableContext 
                  id={col} 
                  items={visibleTasks.filter(t => t.status === col).map(t => t.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  {visibleTasks.filter(t => t.status === col).map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onDelete={handleDeleteTask} 
                      onAction={handleWorkflowAction} 
                      userRole={user?.role} 
                      currentUserId={user?.id} 
                    />
                  ))}
                </SortableContext>
                
                {/* Add Task Button / Form (Admin Only, Open Tasks Only) */}
                {user?.role === 'ADMIN' && col === 'Open Tasks' && (
                  addingToColumn === col ? renderAddTaskForm(col) : (
                    <button 
                      onClick={() => setAddingToColumn(col)} 
                      className="w-full mt-3 py-3 text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-center gap-2 border-2 border-dashed border-slate-300"
                    >
                      <Plus size={18} /> Add New Task
                    </button>
                  )
                )}
              </div>
            ))}
            
          </div>
        </DndContext>
      )}
    </div>
  );
};