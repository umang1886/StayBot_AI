/** Auth API calls */
import { client } from "./client.js";
export const register = (data) => client.post("/api/auth/register", data);
export const login = (data) => client.post("/api/auth/login", data);
export const changePassword = (data) => client.post("/api/auth/change-password", data);
