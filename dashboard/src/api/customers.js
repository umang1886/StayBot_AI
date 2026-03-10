/** Customers API calls */
import { client } from "./client.js";

export const listCustomers = (params) => client.get("/api/customers", { params });
export const getCustomerDetail = (phone, hotel_id) => client.get(`/api/customers/${phone}`, { params: { hotel_id } });
export const exportCustomers = (hotel_id) => client.get("/api/customers/export", {
  params: { hotel_id },
  responseType: "blob",
});
