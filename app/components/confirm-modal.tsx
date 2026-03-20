import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  variant?: "primary" | "destructive";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  variant = "primary",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0B0F1A] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                variant === "destructive" ? "bg-red-500/20" : "bg-[#6C5CE7]/20"
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${
                  variant === "destructive" ? "text-red-400" : "text-[#6C5CE7]"
                }`}
              />
            </div>
            <h3 className="text-xl text-white">{title}</h3>
          </div>

          <p className="text-white/60">{description}</p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl text-white transition-all ${
                variant === "destructive"
                  ? "bg-red-500 hover:bg-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                  : "bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_30px_rgba(108,92,231,0.5)]"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
