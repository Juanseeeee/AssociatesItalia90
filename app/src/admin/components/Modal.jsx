import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  // Eliminamos el bloqueo del scroll del body para permitir que el usuario mantenga el control del scroll del navegador
  // y evitar saltos visuales o la sensación de que la interfaz está "trabada".
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div 
          className="bg-[var(--surface)] rounded-xl shadow-xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200 border border-[var(--border)] text-left relative my-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10 rounded-t-xl">
            <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
            <button 
              onClick={onClose}
              className="btn-icon hover:bg-[var(--background)]"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--border)] bg-[var(--background)] rounded-b-xl sticky bottom-0 z-10">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
