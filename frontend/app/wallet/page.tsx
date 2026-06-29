"use client";

import { useEffect, useRef, useState } from "react";
import { Nav } from "@/components/Nav";
import axios from "axios";
import { getAssets, getBalances, onRamp } from "../utils/httpClient";
import { useAuth } from "@/context/useAuth";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

const ASSETS = [
  {
    sym: "USDC",
    name: "USD Coin",
    balance: 12408.42,
    networks: ["Ethereum", "Solana", "Base", "Arbitrum"],
  },
  { sym: "BTC", name: "Bitcoin", balance: 0.4218, networks: ["Bitcoin"] },
  {
    sym: "ETH",
    name: "Ethereum",
    balance: 3.1842,
    networks: ["Ethereum", "Arbitrum", "Base"],
  },
  { sym: "SOL", name: "Solana", balance: 28.42, networks: ["Solana"] },
  {
    sym: "USDT",
    name: "Tether",
    balance: 2150.12,
    networks: ["Ethereum", "Tron"],
  },
];

export interface Asset {
  name: string;
}

export interface AssetBalances {
  assetName: string;
  balance: number;
}

export default function WalletPage() {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [asset, setAsset] = useState(ASSETS[0]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetBalances, setAssetBalances] = useState<AssetBalances[]>([]);
  const [network, setNetwork] = useState(asset.networks[0]);
  const [assetsLoading, setAssetsLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const onRampInputRef = useRef<HTMLInputElement>(null);
  const onRampSelectorRef = useRef<HTMLSelectElement>(null);

  const router = useRouter();

  const { isLoggedIn } = useAuth();
  const [transactionDone, setTransactionDone] = useState<boolean>(false);

  async function init() {
    try {
      setAssetsLoading(true);
      const foundAssets = await getAssets();
      const foundAssetBalances = await getBalances();
      console.log("assets found are : ", foundAssets);
      setAssets(foundAssets);
      setAssetBalances(foundAssetBalances);
    } catch (err) {
      console.error(err);
    } finally {
      setAssetsLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (isLoggedIn && transactionDone) {
      init();
    }
  }, [transactionDone]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="min-h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <main className="mx-auto max-w-[1200px] px-4 py-10 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Wallet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Move funds in and out of your Lumen account.
          </p>
        </div>

        <div>
          {/* Balances list */}
          <section className="surface-panel overflow-hidden">
            <div className="flex gap-4 m-7 items-center">
              <div className="flex items-center flex-1">
                <input
                  className="w-full border rounded-xl p-5"
                  placeholder="quantity"
                  ref={onRampInputRef}
                />
              </div>

              <div className="w-36">
                <Selector label="Asset">
                  <select
                    value={asset.sym}
                    ref={onRampSelectorRef}
                    onChange={(e) => {
                      const a = ASSETS.find((x) => x.sym === e.target.value)!;
                      setAsset(a);
                      setNetwork(a.networks[0]);
                    }}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {assets.length > 0 &&
                      assets.map((a) => (
                        <option
                          key={a.name}
                          value={a.name}
                          className="bg-surface"
                        >
                          {a.name}
                        </option>
                      ))}
                  </select>
                </Selector>
              </div>
              <div className="w-48">
                {isLoggedIn ? (
                  <button
                    onClick={async () => {
                      if (
                        !onRampInputRef.current ||
                        !onRampSelectorRef.current
                      ) {
                        alert("qty to be on-ramp and select and asset");
                        return;
                      }

                      if (
                        onRampInputRef.current.value == "" ||
                        onRampSelectorRef.current.value == ""
                      ) {
                        alert("Enter qty to be on-ramp and select and asset");
                        return;
                      }

                      try {
                        setTransactionDone(false);
                        const res = await onRamp(
                          onRampSelectorRef.current.value,
                          onRampInputRef.current.value,
                        );

                        if (res.message == "On ramp succesful") {
                          setTransactionDone(true);
                          setToast({
                            message: `${res.message}`,
                            type: "success",
                          });
                        } else {
                          setToast({
                            message: `${res.error}`,
                            type: "error",
                          });
                        }
                      } catch (err) {
                        console.error(err);
                        setToast({
                          message: `${err}`,
                          type: "error",
                        });
                      } finally {
                        setTransactionDone(true);
                      }
                    }}
                    className="btn-primary text-sm h-12 w-full cursor-pointer"
                  >
                    ON-Ramp
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      router.push("/auth?mode=signin");
                    }}
                    className="btn-primary text-sm h-12 w-full cursor-pointer"
                  >
                    SignIn
                  </button>
                )}
              </div>
            </div>

            {/* <div className="border-b border-border px-4 py-3 text-sm font-medium">
              Your assets
            </div>
            <ul>
              {ASSETS.map((a) => {
                const active = asset.sym === a.sym;
                return (
                  <li key={a.sym}>
                    <button
                      onClick={() => {
                        setAsset(a);
                        setNetwork(a.networks[0]);
                      }}
                      className={`flex w-full items-center justify-between border-b border-border/60 px-4 py-3 text-left text-sm transition-colors last:border-0 ${
                        active ? "bg-surface-2" : "hover:bg-surface-2/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-xs font-bold">
                          {a.sym.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{a.sym}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="num text-sm font-medium">
                          {a.balance.toLocaleString()}
                        </div>
                        <div className="num text-xs text-muted-foreground">
                          $
                          {(
                            a.balance *
                            (a.sym === "BTC"
                              ? 104238
                              : a.sym === "ETH"
                                ? 3842
                                : a.sym === "SOL"
                                  ? 218
                                  : 1)
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul> */}
          </section>

          {/* Balance summary */}
          {/* <div className="surface-panel mb-6 flex flex-wrap items-end justify-between gap-6 p-6 mt-7">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total balance (USD)
              </div>
              <div className="num mt-2 text-4xl font-semibold">$58,402.18</div>
              <div className="num mt-1 text-xs text-buy">+$1,284.20 (24h)</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTab("deposit")}
                className="btn-primary text-sm"
              >
                ON-Ramp
              </button>
            </div>
          </div> */}

          <div className="surface-panel mb-6 p-6 mt-7">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
              Your assets
            </div>

            {assetsLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading assets...
              </div>
            ) : !isLoggedIn || assets.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No assets found.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {assetBalances.map((assetBalance) => (
                  <div
                    key={assetBalance.assetName}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="text-sm font-medium">
                      {assetBalance.assetName}
                    </div>
                    <div className="num text-sm font-semibold">
                      {assetBalance.balance.toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action panel */}
          {/* <section className="surface-panel overflow-hidden">
            <div className="grid grid-cols-2 border-b border-border text-sm">
              {(["deposit", "withdraw"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-3 font-medium capitalize transition-colors ${
                    tab === t
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <Selector label="Asset">
                  <select
                    value={asset.sym}
                    onChange={(e) => {
                      const a = ASSETS.find((x) => x.sym === e.target.value)!;
                      setAsset(a);
                      setNetwork(a.networks[0]);
                    }}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {ASSETS.map((a) => (
                      <option key={a.sym} value={a.sym} className="bg-surface">
                        {a.sym} — {a.name}
                      </option>
                    ))}
                  </select>
                </Selector>
                <Selector label="Network">
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {asset.networks.map((n) => (
                      <option key={n} value={n} className="bg-surface">
                        {n}
                      </option>
                    ))}
                  </select>
                </Selector>
              </div>

              {tab === "deposit" ? (
                <DepositPanel asset={asset.sym} network={network} />
              ) : (
                <WithdrawPanel asset={asset} network={network} />
              )}
            </div>
          </section> */}
        </div>

        {/* Recent activity */}
        {/* <section className="surface-panel mt-6 overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-sm font-medium">
            Recent transactions
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Asset</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5">Network</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  type: "Deposit",
                  asset: "USDC",
                  amount: "+2,500.00",
                  net: "Solana",
                  status: "Confirmed",
                  time: "2h ago",
                },
                {
                  type: "Withdraw",
                  asset: "ETH",
                  amount: "-0.5000",
                  net: "Arbitrum",
                  status: "Confirmed",
                  time: "Yesterday",
                },
                {
                  type: "Deposit",
                  asset: "BTC",
                  amount: "+0.1240",
                  net: "Bitcoin",
                  status: "Confirmed",
                  time: "Mar 12",
                },
                {
                  type: "Withdraw",
                  asset: "USDC",
                  amount: "-800.00",
                  net: "Base",
                  status: "Pending",
                  time: "Mar 11",
                },
              ].map((r, i) => (
                <tr key={i} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <span
                      className={`chip ${r.type === "Deposit" ? "!bg-buy-soft !text-buy" : "!bg-sell-soft !text-sell"}`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.asset}</td>
                  <td
                    className={`num px-4 py-3 text-right ${r.amount.startsWith("+") ? "text-buy" : "text-sell"}`}
                  >
                    {r.amount}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.net}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs ${r.status === "Confirmed" ? "text-buy" : "text-warning"}`}
                    >
                      ● {r.status}
                    </span>
                  </td>
                  <td className="num px-4 py-3 text-right text-muted-foreground">
                    {r.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section> */}
      </main>
    </div>
  );
}

function Selector({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="rounded-md border border-border bg-input px-3 py-2.5 focus-within:border-primary">
        {children}
      </div>
    </label>
  );
}

function DepositPanel({ asset, network }: { asset: string; network: string }) {
  const address = `${asset.toLowerCase()}1q${network.toLowerCase()}_8f2k3p9x4nq7vc2hr5kt9bn4mz3pl8wq`;
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
        ⚠ Send only <strong>{asset}</strong> over the <strong>{network}</strong>{" "}
        network. Other assets will be lost.
      </div>

      <div className="flex items-center gap-4 rounded-md border border-border bg-surface-2 p-4">
        <div className="grid h-32 w-32 shrink-0 place-items-center rounded-md bg-foreground p-2">
          <QrPattern />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Deposit address
          </div>
          <div className="num mt-1 break-all text-xs">{address}</div>
          <button
            onClick={() => navigator.clipboard?.writeText(address)}
            className="btn-ghost mt-3 text-xs"
          >
            Copy address
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Meta k="Min deposit" v={`0.00010 ${asset}`} />
        <Meta k="Confirmations" v="12 blocks" />
        <Meta k="ETA" v="~3 minutes" />
        <Meta k="Deposit fee" v="Free" />
      </dl>
    </div>
  );
}

function WithdrawPanel({
  asset,
  network,
}: {
  asset: { sym: string; balance: number };
  network: string;
}) {
  const [amount, setAmount] = useState("");
  const [addr, setAddr] = useState("");
  return (
    <div className="space-y-4">
      <label className="block">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Destination address</span>
          <span>{network}</span>
        </div>
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Paste address"
          className="num w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </label>

      <label className="block">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Amount</span>
          <span>
            Available{" "}
            <span className="num text-foreground">
              {asset.balance.toLocaleString()} {asset.sym}
            </span>
          </span>
        </div>
        <div className="flex items-center rounded-md border border-border bg-input px-3 focus-within:border-primary">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="num w-full bg-transparent py-2.5 text-sm outline-none"
          />
          <button
            onClick={() => setAmount(asset.balance.toString())}
            className="text-xs text-primary"
          >
            MAX
          </button>
          <span className="ml-3 text-xs text-muted-foreground">
            {asset.sym}
          </span>
        </div>
      </label>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Meta
          k="Network fee"
          v={asset.sym === "USDC" ? "Free" : `0.0001 ${asset.sym}`}
        />
        <Meta k="ETA" v="~1 minute" />
        <Meta k="Min withdrawal" v={`0.001 ${asset.sym}`} />
        <Meta k="Daily limit" v="500,000 USD" />
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">You will receive</span>
        <span className="num font-medium">
          {amount || "0.00"} {asset.sym}
        </span>
      </div>

      <button className="btn-primary w-full" disabled={!amount || !addr}>
        Withdraw {asset.sym}
      </button>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2">
      <div className="text-muted-foreground">{k}</div>
      <div className="num mt-0.5 font-medium text-foreground">{v}</div>
    </div>
  );
}

function QrPattern() {
  const size = 17;
  const cells: boolean[] = Array.from({ length: size * size }, (_, i) => {
    const x = i % size,
      y = Math.floor(i / size);
    if ((x < 4 && y < 4) || (x > 12 && y < 4) || (x < 4 && y > 12))
      return (
        x === 0 ||
        x === 3 ||
        y === 0 ||
        y === 3 ||
        (x >= 1 && x <= 2 && y >= 1 && y <= 2)
      );
    return (x * 31 + y * 17 + 7) % 3 === 0;
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      {cells.map((on, i) =>
        on ? (
          <rect
            key={i}
            x={i % size}
            y={Math.floor(i / size)}
            width={1}
            height={1}
            fill="#0a0a0a"
          />
        ) : null,
      )}
    </svg>
  );
}
