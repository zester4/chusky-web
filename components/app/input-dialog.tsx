"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InputDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (value: string) => void | Promise<void>;
};

export function InputDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  defaultValue = "",
  placeholder,
  submitLabel,
  onSubmit,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [defaultValue, open]);

  const submit = async () => {
    const nextValue = value.trim();
    if (!nextValue || busy) return;

    setBusy(true);
    try {
      await onSubmit(nextValue);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] gap-4 rounded-xl p-4 sm:max-w-md sm:p-5">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          <DialogDescription className="text-xs leading-5 sm:text-sm">{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <label htmlFor="input-dialog-value" className="text-xs font-medium">{label}</label>
          <input
            id="input-dialog-value"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
            }}
            placeholder={placeholder}
            autoFocus
            className="min-h-9 w-full border border-foreground/15 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-foreground/50"
          />
        </div>
        <DialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => onOpenChange(false)} className="h-9 rounded-full border border-foreground/15 px-3 text-xs hover:border-foreground/40">Cancel</button>
          <button type="button" disabled={!value.trim() || busy} onClick={() => void submit()} className="h-9 rounded-full bg-foreground px-3 text-xs text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Working…" : submitLabel}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
