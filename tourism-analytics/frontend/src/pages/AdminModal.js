import { useEffect, useState } from 'react';
import { handleApi } from '../api/handleApi';
import { adminLogin, changeAdminPassword, uploadCsv, uploadPdf } from '../api/internalApi';

export default function AdminModal({ isOpen, onClose }) {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [file, setFile] = useState(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [uploadData, setUploadData] = useState(null); // 파일 formData
  const [regionToUpload, setRegionToUpload] = useState(''); // 모달 내 지역 선택값
  


  

  const handleLogin = async () => {
    const { data, error } = await handleApi(adminLogin, { admin_password: password });
    console.log(data);
    
    if (error) return alert(error);
    setIsAuthenticated(true);
  };

  const handleResetPassword = async () => {
    if (!currentPassword) return alert('현재 비밀번호를 입력하세요.');
    if (!newPassword) return alert('새 비밀번호를 입력하세요.');
  
    const { error } = await handleApi(changeAdminPassword, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  
    if (error) return alert(error);
  
    alert('비밀번호가 변경되었습니다.');
    setCurrentPassword('');
    setNewPassword('');
    setIsResetMode(false); // 다시 업로드 화면으로 복귀
  };
  


  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]; // 사용자가 선택한 파일
    if (selectedFile) {
      setFile(selectedFile); // 상태에 저장 → 나중에 업로드할 때 사용
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('파일을 선택하세요.');
  
    const ext = file.name.split('.').pop().toLowerCase();
    const formData = new FormData();
    formData.append('file', file);
  
    if (ext === 'csv') {
      // ✅ 지역 선택 모달 무조건 표시
      setUploadData(formData);
      setShowRegionModal(true);
      return;
    }
  
    if (ext === 'pdf') {
      const { error } = await handleApi(uploadPdf, formData);
      if (error) return alert(error);
  
      alert('업로드 성공');
      setFile(null);
    }
  };
  
  
  

  const resetFile = () => {
    setFile(null);
    // input 요소도 초기화 필요 시 ref로 접근 가능
  };

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setNewPassword('');
      setFile(null);
      setIsAuthenticated(false);
      setIsResetMode(false);
    }
  }, [isOpen]);


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] grid h-screen w-screen place-items-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative mx-auto w-full max-w-[24rem] rounded-lg overflow-hidden shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white p-6">
          {!isAuthenticated ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // 새로고침 방지
                  handleLogin();      // 엔터 또는 버튼 클릭 시 모두 실행
                }}
              >
                <h3 className="text-xl font-bold text-center mb-4">관리자 인증이 필요합니다</h3>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin Password"
                  className="w-full border rounded px-3 py-2 mb-4"
                />
                <button
                  type="submit" // submit으로 설정해야 엔터키로도 동작함
                  className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-600"
                >
                  인증하기
                </button>
              </form>
            </>
            ) : isResetMode ? (
              // 초기화 UI
              <>
                <h3 className="text-xl font-bold text-center mb-4">비밀번호 변경</h3>

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호"
                  className="w-full border rounded px-3 py-2 mb-2"
                />

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호"
                  className="w-full border rounded px-3 py-2 mb-4"
                />

                <button
                  onClick={handleResetPassword}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500"
                >
                  변경 완료
                </button>

                <button
                  onClick={() => setIsResetMode(false)}
                  className="w-full mt-2 text-sm text-gray-500 hover:underline"
                >
                  돌아가기
                </button>

              </>
            ) : (
            <>
              {/* 업로드 UI 영역 */}
              <div className="mb-4">
                {/* ✅ 점선 업로드 박스 */}
                <label
                  htmlFor="file-upload"
                  className="block border-2 border-dashed border-blue-700 h-48 bg-gray-100 rounded-lg flex flex-col justify-center items-center cursor-pointer"
                >
                  <i className="fa fa-folder-open fa-3x text-blue-700" />
                  <p className="text-gray-400 mt-2">파일을 선택하세요</p>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv, .pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

{showRegionModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded shadow-lg">
      <h2 className="text-lg font-semibold mb-4">업로드할 지역을 선택하세요</h2>

      <select
        value={regionToUpload}
        onChange={(e) => setRegionToUpload(e.target.value)}
        className="border rounded px-3 py-2 mb-4 w-full"
      >
        <option value="">지역 선택</option>
        <option value="거창군">거창군</option>
        <option value="거제시">거제시</option>
        <option value="고성군">고성군</option>
        <option value="김해시">김해시</option>
        <option value="남해군">남해군</option>
        <option value="밀양시">밀양시</option>
        <option value="사천시">사천시</option>
        <option value="산청군">산청군</option>
        <option value="양산시">양산시</option>
        <option value="의령군">의령군</option>
        <option value="진주시">진주시</option>
        <option value="창녕군">창녕군</option>
        <option value="창원시 마산합포구">마산합포구</option>
        <option value="창원시 마산회원구">마산회원구</option>
        <option value="창원시 성산구">성산구</option>
        <option value="창원시 의창구">의창구</option>
        <option value="창원시 진해구">진해구</option>
        <option value="통영시">통영시</option>
        <option value="하동군">하동군</option>
        <option value="함안군">함안군</option>
        <option value="함양군">함양군</option>
        <option value="합천군">합천군</option>
      </select>

      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => {
            setShowRegionModal(false);
            setRegionToUpload('');
            setUploadData(null);
          }}
        >
          취소
        </button>

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={async () => {
            if (!regionToUpload) return alert('지역을 선택해주세요');

            const { error } = await handleApi(uploadCsv, uploadData, regionToUpload);
            if (error) return alert(error);

            alert('업로드 성공');
            setShowRegionModal(false);
            setUploadData(null);
            setRegionToUpload('');
            setFile(null);
          }}
        >
          업로드
        </button>
      </div>
    </div>
  </div>
)}


                {/* ✅ 파일명 + 삭제 버튼 */}
                {file && (
                  <div className="mt-4 text-sm text-center text-gray-600">
                    선택된 파일: <span className="font-medium text-gray-800">{file.name}</span>
                    <button
                      onClick={resetFile}
                      className="ml-2 text-red-500 hover:underline text-xs"
                    >
                      ❌ 제거
                    </button>
                  </div>
                )}

              </div>
              <div
                className="text-center text-white bg-indigo-800 py-4 rounded mb-4 cursor-pointer hover:bg-indigo-700 transition"
                onClick={handleUpload}
              >
                <h3 className="text-xl font-bold">파일 업로드</h3>
              </div>
              <button
                onClick={async () => {
                  // 로그아웃 API 요청

                  // 상태 초기화
                  setIsAuthenticated(false);
                  setPassword('');
                  setFile(null);
                  setIsResetMode(false);

                  // 모달 닫기
                  onClose();
                }}
                className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-600"
              >
                닫기
              </button>

              {/* ✅ 인증키 초기화 텍스트 */}
              <p
                className="flex justify-center mt-4 text-sm text-slate-600 hover:underline cursor-pointer"
                onClick={() => setIsResetMode(true)}
              >
                🔑 인증키 초기화
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
