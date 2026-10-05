// Media library picker: browse previously uploaded assets, reuse one (returns
// its URL) or delete it. Backed by the optional `media` integration.

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Modal, Skeleton } from "./ui";
import { useBuilderIntegrations } from "./context";
import type { MediaAsset, MediaLibrary } from "./context";

function fmtSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function MediaPicker({
  media,
  open,
  onOpenChange,
  onSelect,
  imagesOnly = true,
}: {
  media: MediaLibrary;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (url: string) => void;
  imagesOnly?: boolean;
}) {
  // The host's own dialog when it has one: the picker opens on top of the
  // builder, which often already sits in a dialog, and stacking, scroll
  // locking and focus trapping are the host's business.
  const Dialog = useBuilderIntegrations().modal ?? Modal;
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    media.list()
      .then((a) => { if (active) setAssets(imagesOnly ? a.filter((x) => (x.type || "").startsWith("image/")) : a); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, media, imagesOnly]);

  async function remove(id: string) {
    setBusyId(id);
    try {
      await media.remove(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Media library" className="max-h-[85vh] max-w-3xl overflow-y-auto">
      <div className="space-y-2">
        {loading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
        ) : assets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No uploads yet. Images you upload appear here.</p>
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground">Click an image to use it. A deleted image stops showing in messages that use it.</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {assets.map((a) => (
                <div key={a.id} className="group relative overflow-hidden rounded-md border border-border/60">
                  <button type="button" onClick={() => { onSelect(a.url); onOpenChange(false); }} className="block w-full">
                    <img src={a.url} alt={a.name ?? ""} className="h-28 w-full object-cover transition-transform group-hover:scale-105" />
                  </button>
                  <div className="flex items-center justify-between gap-1 px-1.5 py-1 text-[10px] text-muted-foreground">
                    <span className="truncate" title={a.name ?? ""}>{a.name || "image"}</span>
                    <span className="shrink-0">{fmtSize(a.size)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    disabled={busyId === a.id}
                    title="Delete"
                    className="absolute right-1 top-1 rounded bg-black/60 p-1 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  >
                    {busyId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Trash2 className="h-3.5 w-3.5 text-red-400" />}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
