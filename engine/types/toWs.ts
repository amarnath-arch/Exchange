export type DepthUpdateMessage = {
  stream: string;
  data: {
    b?: [string, string][];
    a?: [string, string][];
    e: "depth";
    s: string;
  };
};

export type TradeAddedMessage = {
  stream: string;
  data: {
    e: "trade";
    t: number;
    m: boolean;
    p: string;
    q: string;
    s: string; // symbol
  };
};

export type TickerUpdateMessage = {
  stream: string;
  data: {
    c?: string;
    h?: string;
    l?: string;
    v?: string;
    V?: string;
    s?: string;
    id: number;
    e: "ticker";
  };
};

export type KLineUpdateMessagte = {
  stream: string;
  data: {
    e: "kline";
    s: string;
    o: string;
    h: string;
    l: string;
    c: string;
    start: string;
    end: string;
    newCandleInitiated: boolean;
  };
};

export type WsMessage =
  | TickerUpdateMessage
  | DepthUpdateMessage
  | TradeAddedMessage
  | KLineUpdateMessagte;
