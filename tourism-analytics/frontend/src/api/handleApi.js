// handleApi.js
export const handleApi = async (apiFunc, ...args) => {
    try {
      const res = await apiFunc(...args);
      return { data: res.data, error: null };
    } catch (err) {
      const funcName = apiFunc.name || 'Unknown API';
  
      const status = err?.response?.status;
      const detail = err?.response?.data?.message || err?.response?.data?.detail;
  
      const errorMessage =
        `[${funcName}] ` +
        (status === 500
          ? '⚠️ 서버 오류가 발생했습니다.'
          : detail || '❓ 알 수 없는 오류입니다.');
  
      return { data: null, error: errorMessage };
    }
  };
  