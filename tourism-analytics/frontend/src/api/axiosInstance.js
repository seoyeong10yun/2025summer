// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/', // 같은 origin이면 빈 문자열 또는 생략 가능
  withCredentials: false, // 쿠키 세션 필요 시 true
});

export default axiosInstance;
