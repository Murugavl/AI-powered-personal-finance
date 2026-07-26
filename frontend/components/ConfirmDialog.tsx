import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ background: "rgba(15,23,42,0.98)", border: "1px solid rgba(124,58,237,0.3)", color: "#e2e8f0" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#f87171" }}>{title}</DialogTitle>
          <DialogDescription style={{ color: "#94a3b8" }}>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.2)", color: "#94a3b8" }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            style={{ background: "linear-gradient(90deg, #ef4444, #dc2626)", border: "none", color: "white" }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
