import axios from 'axios';

// Get API URL from environment variable or default to localhost
// For local development with proxy, this might be empty string or relative path
// But for separate backend, we need the full URL
const API_URL = process.env.REACT_APP_API_URL || 'https://hungnguyenpage.com:3004';

console.log('Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export { API_URL };
export default api;
