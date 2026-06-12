import axios from "axios";
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const BASE_URL = configuredBaseUrl === "__SAME_ORIGIN__"
    ? ""
    : configuredBaseUrl || "http://localhost:8091";
export const API_URL = `${BASE_URL}/api`;
export const http = axios.create({
    baseURL: API_URL,
});
