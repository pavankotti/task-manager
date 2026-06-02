'use client';

import React, { useState, useEffect, use } from 'react';
import axios from 'axios';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { TaskCard } from '@/components/TaskCard';
import { BoardSkeleton } from '@/components/BoardSkeleton';
import { Layout } from '@/components/Layout';

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

export default function BoardPage({ params }) {
  const resolvedParams = use(params);
  const { projectId } = resolvedParams;
  const { user } = useAuth(); 
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToColumn, setAddingToColumn] = useState(null); 
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('LOW');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // background polling helper
  const fetchBoard = async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/tasks`);
      setTasks(res.data);
    } catch (err) { 
      console.error('Failed to fetch board data:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (user && projectId) {
      fetchBoard();
      const interval = setInterval(fetchBoard, 3000);
      return () => clearInterval(interval);
    }
  }, [projectId, user]);

  // Derived state with correct sorting order (Issue 2)
  const visibleTasks = tasks
    .filter((task) => {
      if (user?.role === 'ADMIN') return true;
      if (task.status === 'Open Tasks' || task.status === 'Staging') return true;
      return task.assigneeId === user?.id;
    })
    .sort((a, b) => {
      // Primary sort by custom drag-and-drop order
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      // Fallback secondary sort by priority weight
      return PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
    }); 

  // Resolves target column and updates orders transaction-safely (Issue 1 and Issue 2)
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Lookup over ID as either task card or column name (Issue 1)
    const overTask = tasks.find(t => t.id === overId);
    const newStatus = overTask ? overTask.status : overId;

    if (!COLUMNS.includes(newStatus)) return;

    // Create a local copy to compute new orders
    const updatedTasks = [...tasks];
    const activeIndex = updatedTasks.findIndex(t => t.id === activeId);
    
    // Update task's status
    updatedTasks[activeIndex].status = newStatus;

    // Get all tasks in the target column
    const colTasks = updatedTasks.filter(t => t.status === newStatus);

    // If dropped over a specific task, move position in array
    if (overTask && activeId !== overId) {
      const overIndexInCol = colTasks.findIndex(t => t.id === overId);
      const activeIndexInCol = colTasks.findIndex(t => t.id === activeId);
      
      const [movedTask] = colTasks.splice(activeIndexInCol, 1);
      colTasks.splice(overIndexInCol, 0, movedTask);
    }

    // Assign sequential order indexes
    colTasks.forEach((t, i) => {
      t.order = i;
    });

    // Update frontend state immediately to prevent visual jumping
    setTasks(prev => {
      return prev.map(t => {
        const matchingUpdated = colTasks.find(u => u.id === t.id);
        if (matchingUpdated) {
          return { ...t, status: newStatus, order: matchingUpdated.order };
        }
        if (t.id === activeId) {
          return { ...t, status: newStatus, order: 0 };
        }
        return t;
      });
    });

    // Persist reorder batch to API (Issue 2)
    try {
      await axios.patch('/api/tasks/reorder', {
        tasks: colTasks.map(t => ({ id: t.id, status: newStatus, order: t.order }))
      });
    } catch (err) {
      console.error("Sync failed:", err);
    }
  };

  const handleAddTask = async (e, status) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await axios.post('/api/tasks', { 
        title: newTaskTitle, 
        priority: newTaskPriority, 
        projectId, 
        dueDate: newTaskDueDate || null 
      });

      setTasks(prev => [...prev, res.data]);
      
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
      await axios.delete(`/api/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handleWorkflowAction = async (action, taskId, extraData = {}) => {
    let payload = { ...extraData };
    
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
      const res = await axios.patch(`/api/tasks/${taskId}/${action}`, payload);
      setTasks(prev => prev.map(t => t.id === taskId ? res.data : t));
    } catch (err) {
      console.error(`Failed to execute workflow: ${action}`, err);
    }
  };

  return (
    <Layout>
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
                  
                  {/* Sortable Tasks Context */}
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
                  
                  {/* Add Task Button (Admin Only, Open Tasks Only) */}
                  {user?.role === 'ADMIN' && col === 'Open Tasks' && (
                    addingToColumn === col ? (
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
                            className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-1.5 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
                          >
                            Save Task
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button 
                        onClick={() => setAddingToColumn(col)} 
                        className="w-full mt-3 py-3 text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 cursor-pointer"
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
    </Layout>
  );
}
