// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api/', 
  withCredentials: false,
});

export default axiosInstance;
