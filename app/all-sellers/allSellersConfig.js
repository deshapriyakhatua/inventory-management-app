import { toast } from "sonner";

/* ── Helper ──────────────────────────────────────────── */
export function copy(text) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`Copied!`, { id: "app-feedback", duration: 3000 }),
    () => toast.error("Failed to copy", { id: "app-feedback", duration: 3000 })
  );
}
