// tradeService.js
import api from "./apiClient";

export async function placeOrder(orderPayload) {
  const res = await api.post("/api/Orders/place", orderPayload);
  return res.data;
}

export async function getOrders() {
  const res = await api.get("/api/Orders");
  return res.data;
}

export const getTrades = async () => {
  const response = await apiClient.get("/trades");
  return response.data.tradesData;
};

export const deleteTrade = async (id) => {
  await apiClient.delete(`/trade/${id}`);
  return id; // return deleted id for convenience
};

export const createTrade = async ({
  stockToken,
  timeFrame,
  tradeDirection,
  numOfShares,
  takeProfit,
  stopLoss,
  tradeOnCandleClose,
  tradeOnCandleOpen,
}) => {
  const response = await apiClient.post("/tradedetails", {
    stockToken,
    timeFrame,
    tradeDirection,
    numOfShares,
    takeProfit,
    stopLoss,
    tradeOnCandleClose,
    tradeOnCandleOpen,
  });

  return response.data;
};
