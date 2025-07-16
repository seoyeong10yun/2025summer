import axios from './axiosInstance';

// ✅ 관리자 로그인
export const adminLogin = (data) =>
  axios.post('/admin/login', data, {
    withCredentials: true,
  });

// ✅ 관리자 로그아웃
export const adminLogout = (sessionId) =>
  axios.post('/admin/logout', { session_id: sessionId }, {
    withCredentials: true,
  });

// ✅ 관리자 비밀번호 변경
export const changeAdminPassword = (data) =>
  axios.post("/admin/change-password", data, {
    withCredentials: true  // ✅ 쿠키(session_id) 포함
  });

// ✅ CSV 데이터 조회
export const getCsvDetail = () =>
  axios.get('/data/csv/current');

// ✅ CSV 업로드
export const uploadCsv = (formData, selectedRegion) => {
  formData.append('region', selectedRegion);

  return axios.post('/admin/csv/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// ✅ Pdf 업로드
export const uploadPdf = (formData, selectedRegion) => {
  formData.append('region', selectedRegion);

  return axios.post('/admin/pdf/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// ✅ CSV 파일 삭제
export const deleteCsv = (filename) =>
  axios.delete(`/csv/${filename}`);


// ✅ AI 리포트 상세 조회
export const getAiReport = () =>
  axios.get('/reports');

