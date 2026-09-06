"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive = false, onConfirm }: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100%-1.5rem)] gap-4 rounded-xl p-4 sm:max-w-md sm:p-5">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-base sm:text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-xs leading-5 sm:text-sm">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:flex-row sm:justify-end">
          <AlertDialogCancel className="mt-0 h-9 rounded-full px-3 text-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => void onConfirm()}
            className={`h-9 rounded-full px-3 text-xs ${destructive ? "bg-destructive text-white hover:bg-destructive/90" : ""}`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
