export const handleApi = async (apiFunc, ...args) => {
  try {
    const res = await apiFunc(...args);

    // ✅ 2xx 응답이면 성공
    return { data: res.data, error: null };
  } catch (err) {
    console.error(`❌ [${apiFunc.name || 'Unknown API'}] API 요청 실패`, err);

    const isAxiosError = !!err?.isAxiosError;

    const funcName = apiFunc.name || 'Unknown API';
    const status = err?.response?.status;
    const responseData = err?.response?.data;

    // 📌 가능한 에러 메시지 우선순위
    const detail =
      responseData?.detail ||
      responseData?.message ||
      responseData?.error ||
      err?.message ||
      '❓ 알 수 없는 오류입니다.';

    // 📌 네트워크 에러 대응
    const errorMessage =
      `[${funcName}] ` +
      (!isAxiosError
        ? `❗ 일반 오류: ${detail}`
        : err.message === 'Network Error'
        ? '🌐 네트워크 오류가 발생했습니다.'
        : status === 500
        ? '⚠️ 서버 오류가 발생했습니다.'
        : detail);

    return { data: null, error: errorMessage };
  }
};
