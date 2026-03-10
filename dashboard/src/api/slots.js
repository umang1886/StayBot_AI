/** Slots API calls */
import { client } from "./client.js";

export const listSlots = (params) => client.get("/api/slots", { params });
export const createSlot = (data) => client.post("/api/slots", data);
export const bulkCreateSlots = (data) => client.post("/api/slots/bulk", data);
export const updateSlot = (id, data) => client.put(`/api/slots/${id}`, data);
export const deleteSlot = (id) => client.delete(`/api/slots/${id}`);
