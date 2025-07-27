import { useEffect, useState } from 'react';
import { handleApi } from '../api/handleApi';
import { adminLogin, changeAdminPassword, uploadExcelFile, uploadReportSource, generateReport } from '../api/internalApi';

export default function AdminModal({ isOpen, onClose }) {
  // 인증 관련 상태
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 비밀번호 변경 관련 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);

  // 파일 업로드 관련 상태
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  

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
    setIsReadingFile(true); // ✅ 로딩 시작

    // 여기서 파일을 직접 읽지 않더라도, 약간의 시간 대기
    setTimeout(() => {
      setFile(selectedFile); // ✅ 파일 상태 설정
      setIsReadingFile(false); // ✅ 로딩 끝
    }, 100); // 아주 짧게 처리 (또는 실제 FileReader 쓴다면 완료 시점에 false)
  };

  const handleUpload = async () => {
    if (!file) return alert('파일을 선택하세요.');
  
    const ext = file.name.split('.').pop().toLowerCase();
    const formData = new FormData();
    formData.append('file', file);

    const confirmUpload = window.confirm(`.${ext} 파일을 업로드하시겠습니까?`);
    if (!confirmUpload) return;
  
    if (ext === 'xls') {
      const { error } = await handleApi(uploadExcelFile, file);
      if (error) return alert(error);

      alert(`업로드 성공`);
    }
  
    if (ext === 'pdf') {
      const { error: uploadError } = await handleApi(uploadReportSource, file);
      if (uploadError) return alert(uploadError);
  
      setIsGenerating(true); // ⏳ 리포트 생성 시작
  
      try {
        const { error: generateError } = await handleApi(generateReport);
        if (generateError) return alert(generateError);
  
        alert('업로드 및 리포트 생성 성공');
        setFile(null);
      } finally {
        setIsGenerating(false); // ✅ 리포트 생성 끝
      }
    }
  };
  
  // 선택한 파일 리셋
  const resetFile = () => {
    setFile(null);
  };

  // 모달이 열릴 때마다 상태 초기화, 관리자설정은 매번 비번 입력하도록
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
                  accept=".xls, .pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                {isReadingFile && (
                  <div className="mt-4 text-sm text-center text-blue-600 font-semibold">
                    ⏳ 파일 처리 중...
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
              {/* 버튼 2개: PDF / XLS 업로드 */}
              <div className="flex gap-4">
                <div
                  className="flex-1 flex items-center justify-center text-center text-white bg-indigo-800 py-4 rounded mb-4 cursor-pointer hover:bg-indigo-700 transition"
                  onClick={isGenerating ? undefined : handleUpload} // 생성 중 클릭 방지
                >
                  {isGenerating ? '리포트 생성 중...' : '📄 PDF 업로드'}
                </div>

                <div
                  className="flex-1 flex items-center justify-center text-center text-white bg-indigo-800 py-4 rounded mb-4 cursor-pointer hover:bg-indigo-700 transition"
                  onClick={isGenerating ? undefined : handleUpload} // 생성 중 클릭 방지
                >
                  {isGenerating ? '리포트 생성 중...' : '📊 XLS 업로드'}
                </div>
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
