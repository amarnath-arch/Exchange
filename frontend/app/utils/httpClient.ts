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
