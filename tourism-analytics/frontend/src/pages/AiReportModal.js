import { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
import { handleApi } from '../api/handleApi'
import { fetchReport } from '../api/internalApi';




const AiReportModal = ({ isOpen, onClose }) => {
  const [report1, setReport1] = useState();
  const [report2, setReport2] = useState();

  const [loading, setLoading] = useState(true);
  const pdfRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
  
    const fetchData = async () => {
      setLoading(true);
  
      const { data, error } = await handleApi(fetchReport);
  
      if (error) {
        alert(error);
        setLoading(false);
        return;
      }
  
      // 실제 데이터가 report1 / report2 형식으로 오지 않으면 여기서 구조 맞춰야 함
      setReport1(data.data_summary);
      setReport2(data.issue_summary);
  
      setLoading(false);
    };
  
    fetchData();
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

  // 🔧 마크다운 텍스트 파싱 (불릿 항목 + 강조 처리)
  const parseBulletText = (text) => {
    if (!text || typeof text !== 'string') return null;
    console.log(report1);

    return text
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map((line, index) => {
        // 불릿 기호 제거
        const content = line.replace(/^- /, '').trim();

        // 강조 텍스트 처리: **text** → <strong>text</strong>
        const withBold = content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
          i % 2 === 1 ? <strong key={i} className="font-semibold text-black">{part}</strong> : part
        );

        return (
          <li key={index} className="mb-3 leading-relaxed">
            <span className="mr-2 text-lg">•</span>
            {withBold}
          </li>
        );
      });
  };



  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-[90vw] max-h-[90vh] w-full sm:w-[1200px] rounded-lg shadow-lg p-6 overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">📄 AI 리포트</h2>

        {loading ? (
          <p>로딩 중...</p>
        ) : (
          <>
            {/* ✅ 리포트 나란히 표시 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              <div className="prose prose-sm text-gray-800">
                <h1 className="pl-10"> 경남지역 관광 데이터 요약 </h1>
                <ReactMarkdown>{report1}</ReactMarkdown>
              </div>
              <div className="prose prose-sm text-gray-800">
                <h1 className="pl-10"> 경남 주요 관광 이슈 </h1>
                <ReactMarkdown>{report2}</ReactMarkdown>
              </div>
            </div>

            {/* ✅ PDF 다운로드 버튼 */}
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

        {/* ✅ PDF 용 세로 전용 출력 */}
        <div className="hidden">
        <div
          ref={pdfRef}
          className="w-[794px] h-[1123px] bg-white text-black px-14 py-10 text-[15px] whitespace-normal break-keep"
        >
          <h1 className="text-3xl font-bold mb-6">경남지역 관광 데이터 요약</h1>
          <ul className="pl-4 list-none">{parseBulletText(report1)}</ul>

          <h1 className="text-3xl font-bold mt-12 mb-6">경남 주요 관광 이슈</h1>
          <ul className="pl-4 list-none">{parseBulletText(report2)}</ul>
        </div>



        </div>
      </div>
    </div>
  );
};

export default AiReportModal;
