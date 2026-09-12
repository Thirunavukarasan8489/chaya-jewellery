'use client';

import { useState } from 'react';
import { Clock, Plus, User } from 'lucide-react';
import { addLeadNote } from '@/lib/actions/admin-leads';
import { toast } from 'react-hot-toast';

interface Note {
  _id: string;
  content: string;
  addedBy?: string;
  createdAt: string;
}

export default function LeadTimeline({ leadId, notes = [] }: { leadId: string, notes: Note[] }) {
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    setIsSubmitting(true);
    
    const result = await addLeadNote(leadId, newNote);
    
    if (result.success) {
      toast.success('Note added successfully');
      setNewNote('');
    } else {
      toast.error(result.error || 'Failed to add note');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-800 rounded-lg shadow-sm">
      <div className="px-5 py-4 border-b border-gold-200 dark:border-gold-800">
        <h2 className="text-lg font-semibold text-gold-800 dark:text-gold-100 flex items-center gap-2">
          <Clock size={18} className="text-gold-400" />
          Timeline & Notes
        </h2>
      </div>
      
      <div className="p-5 border-b border-gold-200 dark:border-gold-800 bg-gold-50 dark:bg-gold-800/50">
        <form onSubmit={handleAddNote} className="flex flex-col gap-3">
          <textarea 
            placeholder="Add a private note or log a call..."
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full bg-white dark:bg-gold-900 border border-gold-200 dark:border-gold-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
          />
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting || !newNote.trim()}
              className="bg-gold-800 hover:bg-gold-900 dark:bg-gold-700 dark:hover:bg-gold-600 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Plus size={16} /> Add Note
            </button>
          </div>
        </form>
      </div>
      
      <div className="p-5">
        {notes.length === 0 ? (
          <p className="text-sm text-gold-500 text-center py-6">No notes or activities yet.</p>
        ) : (
          <ul className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-gold-200 dark:before:bg-gold-800">
            {notes.slice().reverse().map((note, index) => (
              <li key={note._id || index} className="relative pl-10">
                <span className="absolute left-1 top-1 size-5 rounded-full bg-gold-100 dark:bg-gold-800 border border-gold-300 dark:border-gold-600 flex items-center justify-center ring-4 ring-white dark:ring-gold-900">
                  <User size={10} className="text-gold-500" />
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-gold-500 mb-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  <div className="bg-gold-50 dark:bg-gold-800/80 rounded-md p-3 border border-gold-100 dark:border-gold-800 text-sm text-gold-700 dark:text-gold-300">
                    {note.content}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
