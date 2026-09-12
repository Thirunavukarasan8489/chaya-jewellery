'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeleteConfirmButtonProps {
  entityId: string;
  entityName: string;
  deleteAction: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export default function DeleteConfirmButton({ entityId, entityName, deleteAction }: DeleteConfirmButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAction(entityId);
      if (result.success) {
        toast.success(`"${entityName}" deleted successfully`);
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete item');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 text-gold-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        title={`Delete ${entityName}`}
      >
        <Trash2 size={16} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gold-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gold-900 rounded-xl shadow-lg max-w-md w-full overflow-hidden border border-gold-200 dark:border-gold-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gold-900 dark:text-white">Delete Item</h3>
                  <p className="text-sm text-gold-500 dark:text-gold-400">Are you sure you want to delete this?</p>
                </div>
              </div>
              
              <div className="bg-gold-50 dark:bg-gold-800/50 p-4 rounded-lg mb-6 border border-gold-100 dark:border-gold-700/50">
                <p className="text-sm text-gold-700 dark:text-gold-300">
                  You are about to delete <span className="font-bold">{entityName}</span>. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gold-600 dark:text-gold-400 hover:text-gold-900 dark:hover:text-white hover:bg-gold-100 dark:hover:bg-gold-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
