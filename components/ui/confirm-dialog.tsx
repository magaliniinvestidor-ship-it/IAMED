'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl shadow-xl border-0">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'
          }`}>
            <AlertTriangle className={`w-7 h-7 ${
              variant === 'danger' ? 'text-red-600' : 'text-amber-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{message}</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              className={`flex-1 text-white cursor-pointer ${
                variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

