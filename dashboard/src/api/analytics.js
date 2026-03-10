/** Analytics API calls */
import { client } from "./client.js";

export const getBookingsPerDay = (params) => client.get("/api/analytics/bookings-per-day", { params });
export const getPeakSlots = (hotel_id) => client.get("/api/analytics/peak-slots", { params: { hotel_id } });
export const getRepeatCustomers = (hotel_id) => client.get("/api/analytics/repeat-customers", { params: { hotel_id } });
export const getStatusBreakdown = (hotel_id) => client.get("/api/analytics/status-breakdown", { params: { hotel_id } });
export const getSummary = (hotel_id) => client.get("/api/analytics/summary", { params: { hotel_id } });
