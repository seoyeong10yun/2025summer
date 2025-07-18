// src/api/openApi.js
import axios from './axiosInstance';

export const getTourVisitorStats = (params) =>
  axios.get('/proxy/tour_data/locgoRegnVisitrDDList', { params });

// ✅ 날씨 예보 API
export const getWeatherForecast = (params) =>
  axios.get('/api/proxy/external-data', {
    params: {
      source: 'weatherapi',
      ...params,
    },
  });

// ✅ 관광 수요 예측 API
export const getTourPrediction = (params) =>
  axios.get('/api/proxy/external-data', {
    params: {
      source: 'tourpreapi',
      ...params,
    },
  });
