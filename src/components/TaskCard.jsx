'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Clock, CheckCircle2, Send, Hand, XCircle } from 'lucide-react';

export const TaskCard = ({ task, onDelete, onAction, userRole, currentUserId }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition 
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  const isOwner = task.assigneeId === currentUserId;
  const proposals = task.proposals || [];
  const hasBid = proposals.some(p => p.userId === currentUserId);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`bg-white p-5 mb-4 rounded-xl border shadow-sm hover:shadow-md transition-all group relative ${
        isOverdue ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-slate-900 leading-tight pr-6">{task.title}</h4>
        {userRole === 'ADMIN' && (
          <button 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => onDelete(task.id)} 
            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {task.dueDate && (
        <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-3 ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
          <Clock size={12} /> 
          {isOverdue ? 'Overdue' : new Date(task.dueDate).toLocaleDateString()}
        </div>
      )}

      {/* STAGING PROPOSALS LIST */}
      {task.status === 'Staging' && proposals.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {proposals.length} Proposals Submitted
          </div>
          {proposals.map((p, i) => (
            <div key={i} className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-indigo-900">
                  {p.email?.split('@')[0] || 'User'} <span className="text-indigo-400 font-normal">({p.expertise || 'General'})</span>
                </span>
                {userRole === 'ADMIN' && (
                  <button 
                    onPointerDown={(e) => e.stopPropagation()} 
                    onClick={() => onAction('assign', task.id, { userId: p.userId, approachText: p.text })} 
                    className="text-[10px] bg-indigo-600 text-white px-2.5 py-1 rounded font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    Accept
                  </button>
                )}
              </div>
              <p className="text-[11px] text-indigo-700">{p.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* WINNING APPROACH */}
      {(task.status === 'Assigned' || task.status === 'Completed') && task.winningApproach && (
         <div className="text-[11px] text-indigo-800 bg-indigo-50 p-2.5 rounded-md mb-2 border border-indigo-100">
           <span className="font-bold">Winning Approach:</span> {task.winningApproach}
         </div>
      )}

      {/* REMARKS */}
      {task.remarks && (
        <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-md mb-2 border border-emerald-100">
          <span className="font-bold">Remarks:</span> {task.remarks}
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
        <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold tracking-wider uppercase ${
          task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 
          task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 
          'bg-slate-100 text-slate-700'
        }`}>
          {task.priority}
        </span>
        
        <div className="flex items-center gap-2">
          {/* BID BUTTON */}
          {(task.status === 'Open Tasks' || task.status === 'Staging') && userRole === 'MEMBER' && !hasBid && (
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => onAction('propose', task.id)} 
              className="flex items-center gap-1 text-[11px] font-bold text-white hover:bg-indigo-700 bg-indigo-600 px-3 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
            >
              <Hand size={12} /> Bid Proposal
            </button>
          )}

          {/* REJECT BUTTON */}
          {task.status === 'Staging' && userRole === 'ADMIN' && (
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => onAction('reject', task.id)} 
              className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:bg-red-50 border border-red-200 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <XCircle size={12} /> Reject All
            </button>
          )}

          {/* SUBMIT WORK BUTTON */}
          {task.status === 'Assigned' && isOwner && !task.remarks && (
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => onAction('submit-work', task.id)} 
              className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <Send size={12} /> Submit Work
            </button>
          )}

          {/* APPROVE WORK BUTTON */}
          {task.status === 'Assigned' && userRole === 'ADMIN' && task.remarks && (
            <button 
              onPointerDown={(e) => e.stopPropagation()} 
              onClick={() => onAction('complete', task.id)} 
              className="flex items-center gap-1 text-[11px] font-bold text-white hover:bg-emerald-700 bg-emerald-600 px-3 py-1.5 rounded-md shadow-sm transition-colors animate-pulse cursor-pointer"
            >
              <CheckCircle2 size={12} /> Approve & Broadcast
            </button>
          )}

          {task.assigneeId && (
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold ring-2 ring-white" title="Assigned">
              👤
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TaskCard;
