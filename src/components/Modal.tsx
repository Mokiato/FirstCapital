import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export default function Modal({ 
  open, onClose, title, children, wide 
}: { 
  open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean 
}) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-[#FBF9F4] w-full ${wide ? 'max-w-2xl' : 'max-w-md'} border border-[#D8D0C4] shadow-2xl`}>
        <div className="flex justify-between items-center p-4 border-b border-[#D8D0C4]">
         <h2 className="font-bold text-lg text-[#332B2B] uppercase tracking-widest">{title ?? ''}</h2>
          <button onClick={onClose} className="text-[#776E64] hover:text-[#332B2B] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
}