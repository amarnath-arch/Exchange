import { useState } from "react";
import Modal from "./Modal";

export default function SwapModal({
  modalOpen,
  modalClose,
  onClick,
}: {
  modalOpen: boolean;
  modalClose: () => void;
  onClick: () => void;
}) {
  return (
    <Modal modalOpen={modalOpen} modalClose={modalClose}>
      <button
        type="button"
        className={`w-full font-semibold  focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-red-500 hover:scale-103 cursor-pointer transition-all duration-200 ease-in-out  text-greenPrimaryButtonText active:scale-98`}
        onClick={() => onClick()}
        data-rac=""
      >
        Confirm Transaction
      </button>
    </Modal>
  );
}
