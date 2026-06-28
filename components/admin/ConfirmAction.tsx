"use client";
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';

export function ConfirmAction({
  onConfirm,
  title = "Confirmar ação?",
  description = "Esta ação não pode ser desfeita.",
  children,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  buttonVariant = "destructive"
}: {
  onConfirm: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 shadow-xl border-border bg-card/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-tighter text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              {title}
            </h4>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
              {description}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest h-8"
              onClick={() => setOpen(false)}>
              {cancelText}
            </Button>
            <Button size="sm" variant={buttonVariant} className="text-[10px] font-black uppercase tracking-widest h-8 px-4"
              onClick={() => { onConfirm(); setOpen(false); }}>
              {confirmText}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
