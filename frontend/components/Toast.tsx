export default function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl text-sm font-medium text-white animate-toast-in ${
        type === "success" ? "bg-green-600" : "bg-red-500"
      }`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="opacity-70 hover:opacity-100 cursor-pointer"
        aria-label="Dismiss"
      >
        ✕
      </button>
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(-12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-toast-in {
          animation: toast-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
