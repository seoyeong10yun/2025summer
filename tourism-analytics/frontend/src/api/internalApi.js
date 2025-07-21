import axios from './axiosInstance';

// ✅ 관리자 로그인
export const adminLogin = (data) => {
  const formData = new URLSearchParams();
  formData.append('password', data.admin_password);

  return axios.post('/admin/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

// ✅ 관리자 비밀번호 변경
export const changeAdminPassword = (data) => {
  const formData = new URLSearchParams();
  formData.append('current_password', data.current_password);
  formData.append('new_password', data.new_password);

  return axios.post('/admin/change-password', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};


// ✅ xls 데이터 조회
export const fetchTouristQuery = (region) =>
  axios.get('/data/query', {
    params: { region },
  });


// ✅ 엑셀 파일 업로드 API
export const uploadExcelFile = (file) => {
  const formData = new FormData();
  formData.append('file', file); // 필드명은 백엔드의 UploadFile 파라미터와 같아야 함

  return axios.post('/data/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


// ✅ CSV 파일 삭제
export const deleteCsv = (filename) =>
  axios.delete(`/csv/${filename}`);


// ✅ 리포트 PDF 업로드
export const uploadReportSource = (file) => {
  const formData = new FormData();
  formData.append('file', file); // 필드명 주의!

  return axios.post('/report/source', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// ✅ AI 리포트 생성 API
export const generateReport = () => {
  return axios.post('/report/generate'); // 빈 POST 요청
};

// ✅ AI 리포트 조회 API
export const fetchReport = () => {
  return axios.get('/report'); // 리포트 JSON을 가져오는 GET 요청
};
