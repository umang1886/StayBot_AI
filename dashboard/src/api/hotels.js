/** Hotels API calls */
import { client } from "./client.js";
export const listHotels = () => client.get("/api/hotels");
export const getHotel = (id) => client.get(`/api/hotels/${id}`);
export const createHotel = (data) => client.post("/api/hotels", data);
export const updateHotel = (id, data) => client.put(`/api/hotels/${id}`, data);
export const updateHotelSheet = (id, sheet_id) => client.put(`/api/hotels/${id}/sheet`, { sheet_id });
