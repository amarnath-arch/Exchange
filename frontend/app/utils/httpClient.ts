import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

const BASE_URL = "http://localhost:3005/api/v1";

export async function getTicker(market: string): Promise<Ticker> {
  const ticker = await getTickers(market);
  console.log("ticker data: ", ticker);
  // const ticker = tickers.find((t) => t.symbol === market);
  if (!ticker) {
    throw new Error(`No ticker found for ${market}`);
  }
  return ticker;
}

export async function getTickers(market: string): Promise<Ticker> {
  const response = await axios.get(`${BASE_URL}/tickers?symbol=${market}`);
  return response.data;
}

export async function getDepth(market: string): Promise<Depth> {
  const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
  return response.data;
}
export async function getTrades(market: string): Promise<Trade[]> {
  const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
  return response.data;
}

export async function getKlines(
  market: string,
  interval: string,
  startTime: number,
  endTime: number,
): Promise<KLine[]> {
  const response = await axios.get(
    `${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`,
  );

  console.log("I got kLine as : ", response);
  const data: KLine[] = response.data;
  // return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
  return data;
}

export async function createOrder(
  market: string,
  quantity: string,
  price: string,
  side: "buy" | "sell",
  type: "limit" | "market",
) {
  try {
    const response = await axios.post(
      `${BASE_URL}/order`,
      {
        market,
        quantity,
        price,
        side,
        type,
      },
      {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      },
    );
    if (response.status == 200) {
      console.log("order data : ", response.data);
    }
  } catch (err) {
    console.error(err);
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const response = await axios.post(`${BASE_URL}/user/sign-in`, {
      email: email,
      password: password,
    });

    const token = response.data.token;

    if (!token) {
      throw new Error("Token not found ");
    }

    localStorage.setItem("token", token);
  } catch (err) {
    console.error(err);
  }
}

export async function signUpUser(email: string, password: string) {
  try {
    const response = await axios.post(`${BASE_URL}/user/sign-up`, {
      email: email,
      password: password,
    });

    const token = response.data.token;

    if (!token) {
      throw new Error("Token not found ");
    }

    localStorage.setItem("token", token);
  } catch (err) {
    console.error(err);
  }
}

export async function getOpenOrders(market: string) {
  const response = await axios.get(`${BASE_URL}/order/open?market=${market}`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });

  console.log("open Orders", response.data);

  if (!response.data.payload) {
    throw new Error("Open Orders not found");
  }

  return response.data.payload;
}

export async function getAssets() {
  const res = await axios.get(`${BASE_URL}/assets`);
  return res.data.assets;
}

export async function getBalances() {
  const res = await axios.get(`${BASE_URL}/balance`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });
  return res.data.balances;
}

export async function onRamp(asset: string, amount: string) {
  const res = await axios.post(
    `${BASE_URL}/on-ramp`,
    {
      asset: asset,
      amount: amount,
    },
    {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    },
  );
}
