import axios from "axios";
import { password } from "bun";
const BASE_URL = "http://localhost:3005";

const test_market = "SOL_USDC";
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
  // const user_token =
  //   "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBiMDI1M2FlLTM2YzctNDM0MC1hZmI5LWRiMzIxNTYyZmE4ZCIsImlhdCI6MTc4MTU0NzYyN30.1EQtQn8HhUN5AYJnQSeXdKVPyhV5iij5i_K6EKmfLIM"; // get the user token //TODO:

  try {
    // signin using test user
    const signInResponse = await axios.post(`${BASE_URL}/api/v1/user/sign-in`, {
      email: test_user_id,
      password: test_user_password,
    });

    const user_token = signInResponse.data.token!;

    const response = await axios.get(
      `${BASE_URL}/api/v1/order/open?market=${test_market}`,
      {
        headers: {
          Authorization: user_token,
        },
      },
    );
    const openOrders: apiResponse = response.data;
    // console.log(openOrders);

    const totalBids = openOrders.payload.filter((o) => o.side == "buy").length;
    const totalAsks = openOrders.payload.filter((o) => o.side == "sell").length;

    let bidsToAdd = TOTAL_BIDS - totalBids;
    let asksToAdd = TOTAL_ASKS - totalAsks;
    const price = 10 + Math.random() * 10;

    // on ramp some amount
    await axios.post(
      `${BASE_URL}/api/v1/on-ramp`,
      {
        amount: 1000,
        asset: "SOL",
      },
      {
        headers: {
          Authorization: user_token,
        },
      },
    );

    await axios.post(
      `${BASE_URL}/api/v1/on-ramp`,
      {
        amount: 1000,
        asset: "USDC",
      },
      {
        headers: {
          Authorization: user_token,
        },
      },
    );

    while (bidsToAdd > 0 || asksToAdd > 0) {
      console.log("bids to Add: ", bidsToAdd);
      console.log("asks to Add: ", asksToAdd);
      if (bidsToAdd > 0) {
        try {
          const res = await axios.post(
            `${BASE_URL}/api/v1/order`,
            {
              market: test_market,
              price: (price - Math.random() * 1).toFixed(1).toString(),
              quantity: "1",
              side: "buy",
            },
            {
              headers: {
                Authorization: user_token,
              },
            },
          );

          // console.log(res);
        } catch (err) {
          console.error(err);
        }

        bidsToAdd--;
      }
      if (asksToAdd > 0) {
        await axios.post(
          `${BASE_URL}/api/v1/order`,
          {
            market: test_market,
            price: (price - Math.random() * 1).toFixed(1).toString(),
            quantity: "1",
            side: "sell",
          },
          {
            headers: {
              Authorization: user_token,
            },
          },
        );
        asksToAdd--;
      }
    }
  } catch (err) {
    console.error(err);
  }

  // main();
}

main();
