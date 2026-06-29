import Modal from "./Modal";

export default function TransactionLoader({
  state,
  side,
}: {
  state: "pending" | "completed" | "error";
  side: "buy" | "sell";
}) {
  const accentColor =
    state === "error"
      ? "#ef4444"
      : state === "completed"
        ? "#22c55e"
        : side === "buy"
          ? "#22c55e"
          : "#ef4444";

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      <div className="relative h-16 w-16 shrink-0">
        {state === "pending" && (
          <svg
            className="h-16 w-16 animate-spin"
            viewBox="0 0 50 50"
            style={{ animationDuration: "0.9s" }}
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="4"
            />
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke={accentColor}
              strokeWidth="4"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray="70 100"
            />
          </svg>
        )}

        {(state === "completed" || state === "error") && (
          <svg className="h-16 w-16" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r="23"
              fill="none"
              stroke={accentColor}
              strokeWidth="3"
              pathLength="100"
              className="tl-draw"
            />
            {state === "completed" ? (
              <path
                d="M15 27l7 7 15-15"
                fill="none"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="100"
                className="tl-draw"
                style={{ animationDelay: "0.25s" }}
              />
            ) : (
              <path
                d="M18 18l16 16M34 18L18 34"
                fill="none"
                stroke={accentColor}
                strokeWidth="4"
                strokeLinecap="round"
                pathLength="100"
                className="tl-draw"
                style={{ animationDelay: "0.25s" }}
              />
            )}
          </svg>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-center px-4">
        <p className="text-sm font-semibold text-baseTextHighEmphasis">
          {state === "pending" && `Placing your ${side} order…`}
          {state === "completed" && "Order placed"}
          {state === "error" && "Order failed"}
        </p>
        <p className="text-xs text-baseTextMedEmphasis">
          {state === "pending" && "This usually takes a few seconds"}
          {state === "completed" && "Your balance has been updated"}
          {state === "error" && "Nothing was deducted — please try again"}
        </p>
      </div>

      <style>{`
        .tl-draw {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: tl-draw-in 0.45s ease-out forwards;
        }
        @keyframes tl-draw-in {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
