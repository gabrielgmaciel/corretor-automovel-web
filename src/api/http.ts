import axios from "axios";

export const BASE_URL =
  "http://localhost:8091";

export const API_URL =
  `${BASE_URL}/api`;

export const http = axios.create({
  baseURL: API_URL,
});
