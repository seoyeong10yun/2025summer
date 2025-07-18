export const handleApi = async (apiFunc, ...args) => {
  try {
    const res = await apiFunc(...args);

    // ✅ 2xx 응답이면 무조건 성공 처리
    return { data: res.data, error: null };
  } catch (err) {
    const funcName = apiFunc.name || 'Unknown API';
    const status = err?.response?.status;

    // ❌ 백엔드 예외 detail 메시지 처리
    const detail = err?.response?.data?.detail || err?.message;

    const errorMessage =
      `[${funcName}] ` +
      (status === 500
        ? '⚠️ 서버 오류가 발생했습니다.'
        : detail || '❓ 알 수 없는 오류입니다.');

    return { data: null, error: errorMessage };
  }
};

