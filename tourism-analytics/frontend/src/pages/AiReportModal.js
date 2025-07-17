import { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';



const dummyReport1 = `
# 경남지역 관광 데이터 요약
- 전년 동기 대비 모든 지표에서 증가세를 보였으며, 특히 방문자 수(전국 18% 증가)와 관광소비(전국 0.4% 증가)가 전국 대비 높게 증가함
- 소셜미디어에서 언급된 경남 관광 관련 키워드 분석 결과, 최다 여행 동반 유형은 **가족, 친구, 부모님**으로, 최다 여행 키워드는 **휴식/힐링, 레포츠, 체험**으로 집계됨
- 전년 동기 대비 외부 방문자 수는 **20.9% 증가**하였고, **김해시, 양산시, 창원시 의창구**를 중심으로 방문자 집중 경향이 나타남
- 내국인의 경우 **부산**(38.9%), **경기**(10.6%), **대구**(9.8%) 지역에서 온 방문자가 가장 많았고, 외국인의 경우 **미국**(19%), **중국**(13.1%), **베트남**(7.7%)에서 온 방문자가 가장 많았음
- 가장 많이 찾은 5개 관광지는 **양산시 통도사, 통영시 통영중앙전통시장, 남해군 독일마을, 함안군 악양생태공원, 거제시 바람의언덕**으로 조사됨
`;
const dummyReport2 =`
# 경남 주요 관광 이슈
- 진주시, 5월 24일부터 9월 27일까지 매주 토요일 밤 남강변에서 ‘리버나이트 진주 남강 별밤 피크닉’ 개최. 버스킹 공연과 함께 맥주와 간식을 제공하며 야간 관광 콘텐츠로 운영  
- 통영시, 5월부터 11월까지 계절별 테마를 담은 ‘투나잇 통영! 사계절 투어’와 체류형 ‘워케이션 패키지’ 상품 운영. QR 스탬프 미션, 기념 굿즈, SNS 인증 이벤트 등 포함  
- 합천군, 5월부터 ‘플로깅 관광 스탬프투어’ 운영. 관광객이 지정 코스를 걸으며 쓰레기를 줍고 모바일 스탬프 인증 시 기념품 제공  
- 거제시, 11대 명산 완등 인증 애플리케이션 ‘거제산타GO’ 출시. 11개 봉우리 완등 시 배지 세트와 거제사랑상품권 등 제공  
- 하동군, 신혼부부 대상 여행 경비 50% 지원 사업 시행. 1박 이상 숙박, 지역 식당 이용, 관광지 방문 등 조건 충족 시 최대 15만 원 지원  
- 남해군, 지역 주민이 운영하는 체험형 관광상품 ‘남해 외갓집’ 출시. 도자기 만들기, 드로잉, 블랙베리 음료 만들기 등 소규모 체험 프로그램 운영  
- 남해군, 5월부터 11월까지 매월 1회 참여 가능한 구독형 여행상품 ‘월간 남해’ 출시. 손모내기, 서핑, 쿠킹 클래스 등 지역 특화 체험 프로그램 포함 
`;


const AiReportModal = ({ isOpen, onClose }) => {
  const [report1, setReport1] = useState(dummyReport1);
  const [report2, setReport2] = useState(dummyReport2);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pdfRef = useRef();

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setTimeout(() => {
      setReport1(dummyReport1);
      setReport2(dummyReport2);

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
      onClick={onClose}
    >
      <div
        className="bg-white max-w-[90vw] max-h-[90vh] w-full sm:w-[1200px] rounded-lg shadow-lg p-6 overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">📄 AI 리포트</h2>

        {loading ? (
          <p>로딩 중...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            {/* ✅ 리포트 나란히 표시 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              <div className="prose prose-sm text-gray-800">
                <ReactMarkdown>{report1}</ReactMarkdown>
              </div>
              <div className="prose prose-sm text-gray-800">
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
            className="w-[794px] h-[1123px] bg-white text-black p-10 prose"
          >
            <ReactMarkdown>{report1}</ReactMarkdown>
            <ReactMarkdown>{report2}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiReportModal;
