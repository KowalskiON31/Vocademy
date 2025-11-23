type Toast = {
  id: string;
  type?: "info" | "success" | "error";
  message: string;
};

export default function Toaster({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`max-w-sm w-full px-4 py-2 rounded shadow-md text-sm ${t.type === 'error' ? 'bg-red-100 text-red-800' : t.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
          <div className="flex items-center justify-between gap-2">
            <div>{t.message}</div>
            <button onClick={() => onRemove(t.id)} className="text-xs px-2 py-1 rounded hover:bg-black/5">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export type { Toast };
