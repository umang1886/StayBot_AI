/** Bookings API calls */
import { client } from "./client.js";

export const listBookings = (params) => client.get("/api/bookings", { params });
export const getBooking = (id) => client.get(`/api/bookings/${id}`);
export const updateBooking = (id, data) => client.put(`/api/bookings/${id}`, data);
export const cancelBooking = (id) => client.delete(`/api/bookings/${id}`);
export const completeBooking = (id) => client.patch(`/api/bookings/${id}/complete`);
