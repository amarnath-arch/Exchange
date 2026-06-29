import Modal from "./Modal";
import TransactionLoader from "./TransactionLoader";

export default function SwapModal({
  modalOpen,
  modalClose,
  onClick,
  transactionState,
  side,
}: {
  modalOpen: boolean;
  modalClose: () => void;
  onClick: () => void;
  transactionState: "open" | "pending" | "completed" | "error";
  side: "buy" | "sell";
}) {
  const isBusy = transactionState === "pending";

  return (
    <Modal modalOpen={modalOpen} modalClose={isBusy ? () => {} : modalClose}>
      {transactionState === "open" ? (
        <button
          type="button"
          className="w-full font-semibold focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-red-500 hover:scale-103 cursor-pointer transition-all duration-200 ease-in-out text-greenPrimaryButtonText active:scale-98"
          onClick={() => onClick()}
          data-rac=""
        >
          Confirm Transaction
        </button>
      ) : transactionState === "error" ? (
        <div className="flex flex-col gap-2">
          <TransactionLoader state="error" side={side} />
          <button
            type="button"
            className="w-full font-semibold text-center h-12 rounded-xl text-base bg-baseBackgroundL2 hover:bg-baseBackgroundL3 cursor-pointer transition-all duration-200"
            onClick={modalClose}
          >
            Close
          </button>
        </div>
      ) : (
        <TransactionLoader state={transactionState} side={side} />
      )}
    </Modal>
  );
}
