import axios from "axios";

const SESSION_KEY = "tc_token";

let _token: string | null = null;

export function setAuthToken(token: string | null, remember = false): void {
  _token = token;
  if (typeof window === "undefined") return;
  if (token) {
    if (remember) {
      localStorage.setItem(SESSION_KEY, token);
      sessionStorage.removeItem(SESSION_KEY);
    } else {
      sessionStorage.setItem(SESSION_KEY, token);
      localStorage.removeItem(SESSION_KEY);
    }
  } else {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
}

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  // For FormData, remove the default Content-Type so the browser sets
  // multipart/form-data with the correct boundary automatically.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosClient;
