// src/api/openApi.js
import axios from './axiosInstance';

// ✅ 관광 방문자 API
export const getTourVisitorStats = (params) =>
  axios.get('/proxy/tour_data/locgoRegnVisitrDDList', { params });

// ✅ 날씨 예보 API
export const getWeatherForecast = (params) =>
  axios.get('/proxy/weather/getUltraSrtFcst', { params });


// ✅ 관광 수요 예측 API
export const getTourPrediction = (params) =>
  axios.get('/proxy/tour_predict/tatsCnctrRatedList', { params });
