import axios from "axios";
const BASE_URL = "http://localhost:3005";

const test_market = "SOL_USD";
const TOTAL_BIDS = 15;
const TOTAL_ASKS = 15;

type apiResponse = {
  type: "OPEN_ORDERS";
  payload: {
    orderId: string;
    executedQty: number;
    price: string;
    quantity: string;
    side: "buy" | "sell";
    userId: string;
  }[];
};

const test_user_id = "xyz@gmail.com";
const test_user_password = "xyz@password";

async function main() {
  const response = await axios.get(
    `${BASE_URL}/api/v1/order/open?market=${test_market}`,
  );

  const openOrders: apiResponse = response.data;

  const totalBids = openOrders.payload.filter((o) => o.side == "buy").length;
  const totalAsks = openOrders.payload.filter((o) => o.side == "sell").length;

  let bidsToAdd = TOTAL_BIDS - totalBids;
  let asksToAdd = TOTAL_ASKS - totalAsks;
  const price = 1000 + Math.random() * 10;

  const user_id = "1"; // get the user token //TODO:

  while (bidsToAdd > 0 || asksToAdd > 0) {
    if (bidsToAdd > 0) {
      await axios.post(`${BASE_URL}/api/v1/order`, {
        market: test_market,
        price: (price - Math.random() * 1).toFixed(1).toString(),
        quantity: "1",
        side: "buy",
      });
      bidsToAdd--;
    }
    if (asksToAdd > 0) {
      await axios.post(`${BASE_URL}/api/v1/order`, {
        market: test_market,
        price: (price - Math.random() * 1).toFixed(1).toString(),
        quantity: "1",
        side: "sell",
      });
      asksToAdd--;
    }
  }

  main();
}

main();
