/** Menu API calls */
import { client } from "./client.js";

export const listMenu = (hotel_id) => client.get("/api/menu", { params: { hotel_id } });
export const createMenuItem = (data) => client.post("/api/menu", data);
export const updateMenuItem = (id, data) => client.put(`/api/menu/${id}`, data);
export const deleteMenuItem = (id) => client.delete(`/api/menu/${id}`);
export const toggleMenuItem = (id) => client.patch(`/api/menu/${id}/toggle`);
