import type React from "react";

export default function Modal({
  modalOpen,
  modalClose,
  children,
}: //   setModalOpen,
{
  modalOpen: boolean;
  children: React.ReactNode;
  modalClose: () => void;
}) {
  if (!modalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-700/80 z-50 flex items-center justify-center"
      onClick={modalClose}
    >
      <div
        className="bg-slate-900 p-8 rounded-xl shadow-2xl w-110 shadow-secondary "
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
