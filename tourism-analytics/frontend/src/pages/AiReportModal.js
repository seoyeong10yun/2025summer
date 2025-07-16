import { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';



const dummyReport = `
# 관광 수요 AI 분석 리포트

**지역:** 경상남도 거제시  
**분석 기간:** 2024년 6월 1일 ~ 2024년 6월 30일

## 요약
- 총 방문객 수: **132,000명** (전월 대비 **8.3% 증가**)
- 주말 방문자 비율: **62%**
- 외국인 관광객 비율: **5.2%** (중국 47%, 일본 25%, 미국 15%)

## AI 예측 결과
- 7월 방문객 수 예측: **약 140,000명**
- 주요 영향 요인: **기상 조건, 평일/주말 패턴**

## 관광객 소비 분석
- 1인당 평균 소비: **92,000원**
- 구성: 음식 38%, 숙박 26%, 교통 15%, 기념품 8%, 기타 13%

## 정책 제안
- 평일 할인 정책 도입
- 다국어 안내 시스템 확대
- 지역별 테마 관광 개발

`;


const AiReportModal = ({ isOpen, onClose }) => {
  const [report, setReport] = useState(dummyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pdfRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setTimeout(() => {
      setReport(dummyReport);
      setLoading(false);
    }, 500); // API 흉내
  }, [isOpen]);

  const handleDownload = () => {
    const opt = {
      margin: 0,
      filename: 'AI_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
    };
    html2pdf().set(opt).from(pdfRef.current).save();
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose} // 바깥 클릭
    >
      <div
        className="bg-white max-w-[90vw] max-h-[90vh] w-full sm:w-[600px] rounded-lg shadow-lg p-6 overflow-auto relative"
        onClick={(e) => e.stopPropagation()} // 내부 클릭 막기
      >
        <h2 className="text-xl font-bold mb-4">📄 AI 리포트</h2>
        {loading ? (
          <p>로딩 중...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <div className="prose prose-sm max-h-[400px] overflow-y-auto text-gray-800">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                PDF 다운로드
              </button>
            </div>
          </>
        )}

        {/* 🖨️ PDF 전용 숨겨진 A4 출력용 */}
        <div className="hidden">
          <div
            ref={pdfRef}
            className="w-[794px] h-[1123px] p-10 bg-white text-black prose"
          >
            <ReactMarkdown>
              {report}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiReportModal;
