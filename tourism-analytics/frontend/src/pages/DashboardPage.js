import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ReactComponent as GyungnamMap } from '../assets/gyungnam-map.svg';
import { signguNameFromSlug, signguXYAixMap , signgureaIdMap} from '../assets/regionMap';
import { Line, Bar as ChartBar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  BubbleController,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { handleApi } from '../api/handleApi';
import { getTourVisitorStats, getWeatherForecast, getTourPrediction } from '../api/openApi';
import { fetchTouristQuery } from '../api/internalApi';
import Chart from "react-google-charts";



ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement,BarElement, BubbleController, ChartTooltip, Legend, Filler, ChartDataLabels);

const changwonAreas = [
  '창원시 마산합포구',
  '창원시 마산회원구',
  '창원시 성산구',
  '창원시 의창구',
  '창원시 진해구',
];


export default function DashboardPage() {  
  const [selected] = useState(() => {
    return sessionStorage.getItem("introSeen") === "true";
  });
  
  const [selectedSigngu, setSelectedSigngu] = useState(() => {
    return sessionStorage.getItem("selectedSigngu") || null;
  });
  

  // 값이 바뀔 때마다 세션에 저장
  useEffect(() => {
    if (selectedSigngu) {
      sessionStorage.setItem("selectedSigngu", selectedSigngu);
    }
  }, [selectedSigngu]);

  useEffect(() => {
    const signguId = Object.keys(signguNameFromSlug).find(
      (key) => signguNameFromSlug[key] === selectedSigngu
    );
    if (signguId) {
      document.querySelector(`svg path[id="${signguId}"]`)?.classList.add('selected');
    }
  }, [selectedSigngu]);
  

  
  
  // ---------------------------------------------------------------------------------------------------------------------------------
  // 관광지역 일별 방문자 수 대시보드
  // ---------------------------------------------------------------------------------------------------------------------------------
  const [visitorData, setVisitorData] = useState(null);
  const [filteredChartData, setFilteredChartData] = useState([]);

  // 웹 사이트 접속시 방문자 수 조회, 이후에는 가지고 있는 데이터에서 필터링 하여 표시하므로 api 재요청 필요없음
  useEffect(() => {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);
  
    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}${mm}${dd}`;
    };
  
    const endYmd = formatDate(oneMonthAgo);  

    const fetchTourismData = async () => {
      const { data, error } = await handleApi(getTourVisitorStats, {
        MobileOS: 'ETC',
        MobileApp: 'AppTest',
        _type: 'json',
        startYmd: endYmd,
        endYmd: endYmd,
        numOfRows: 1000,
        pageNo: 1,
      });
    
      if (error) {
        console.error(error);
        return;
      }
    
      // 공공 API 응답 구조에 따라 처리
      setVisitorData(data.response.body.items.item);
    };
    
    
  
    fetchTourismData();
  }, []);
  


  // 지도에서 지역을 선택하면 동작, 방문자 수 데이터에서 지역을 필터링 하고 현지인, 외지인, 외국인으로 나눠 그래프로 표시할 수 있도록 chartData로 저장
  useEffect(() => {
    if (visitorData && selectedSigngu) {
      const matched = visitorData.filter(item => item.signguNm === selectedSigngu);
  
      // touDivNm 별로 touNum 합산
      const grouped = {};
      matched.forEach(item => {
        const type = item.touDivNm;
        const count = parseInt(item.touNum, 10) || 0;
        grouped[type] = (grouped[type] || 0) + count;
      });
  
      // 그래프용 데이터 포맷
      const chartData = Object.entries(grouped).map(([touDivNm, touNum]) => ({
        touDivNm,
        touNum,
      }));
  
      setFilteredChartData(chartData);  // 상태값으로 저장
    }
  }, [visitorData, selectedSigngu]);


  const labels = filteredChartData.map(item => item.touDivNm); // ex: 현지인, 외지인, 외국인
  const dataValues = filteredChartData.map(item => item.touNum);

  const chartData = {
    labels,
    datasets: [
      {
        label: '방문자 수',
        data: dataValues,
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // 막대 색
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // 범례 숨김
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y}명`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

   



  // ---------------------------------------------------------------------------------------------------------------------------------
  // 초단기예보 조회
  // ---------------------------------------------------------------------------------------------------------------------------------
  const [forecastData, setForecastData] = useState([]);
  const [chartData1, setChartData1] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('T1H'); // 기본 기온
  const [selectedLabel, setSelectedLabel] = useState('기온');
  

  // 지도에서 지역을 클릭 시 지역에 관한 날씨 조회 API 요청 (기온-하늘상태, 강수량-강수형태, 습도)
  useEffect(() => {

    const fetchTourismData = async () => {

      if (!selectedSigngu) return;

      const signguXY = signguXYAixMap[selectedSigngu];
      if (!signguXY) return;

      const now = new Date();
      now.setHours(now.getHours() - 1); // 1시간 이전으로 이동
      
      const baseDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const baseTime = `${String(now.getHours()).padStart(2, '0')}30`; // 항상 30분
      const nx = signguXY.nx;
      const ny = signguXY.ny;
      
      
      const { data, error } = await handleApi(getWeatherForecast, {
        pageNo: '1',
        numOfRows: '100',
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx,
        ny,
      });

    
      if (error) {
        console.error(error);
        return;
      }
    
      // 공공 API 응답 구조에 따라 처리
      setForecastData(data.response.body.items.item);
    };
  
    fetchTourismData();
  }, [selectedSigngu]);  

  // api 응답중 강수형태와 하늘 상태는 문자열이 아닌 코드로 응답하여 따로 매칭해서 표시해줘야함.
  const handleClick = useCallback((category, label) => {
    const ptyCodeMap = {
      '0': '강수없음',
      '1': '비',
      '2': '비/눈',
      '3': '눈',
      '4': '소나기',    
      '5': '빗방울',   
      '6': '빗방울눈날림',
      '7': '눈날림',
    };
  
    const skyCodeMap = {
      '1': '맑음',
      '3': '구름많음',
      '4': '흐림',
    };

    const now = new Date();
    const nowStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const nowHour = now.getHours();
  
    const data = forecastData.filter(item =>
      item.fcstDate === nowStr &&
      parseInt(item.fcstTime.slice(0, 2)) >= nowHour &&
      parseInt(item.fcstTime.slice(0, 2)) <= nowHour + 6
    );
  
    const targetItems = data.filter(item => item.category === category);
  
    let result = [];
    

    // 강수량을 표시할때 강수형태 동시에 표시하기 위한 코드
    if (category === 'RN1') {
      const ptyItems = data.filter(item => item.category === 'PTY');
      result = targetItems.map(item => {
        const time = `${item.fcstTime.slice(0, 2)}:${item.fcstTime.slice(2, 4)}`;
        const ptyItem = ptyItems.find(p => p.fcstTime === item.fcstTime);
        const ptyText = ptyItem ? ptyCodeMap[ptyItem.fcstValue] : '';
        console.log(item)
        return {
          time: [`${time}`, `${ptyText}`],
          value: item.fcstValue === '강수없음' ? 0 : parseFloat(item.fcstValue),
        };
      });
    } 
    // 기온을 표시할때 하늘상태 동시에 표시하기 위한 코드
    else if (category === 'T1H') {
      const skyItems = data.filter(item => item.category === 'SKY');
      const humidityItems = data.filter(item => item.category === 'REH');
    
      result = targetItems.map(item => {
        const time = `${item.fcstTime.slice(0, 2)}:${item.fcstTime.slice(2, 4)}`;
        
        // SKY 텍스트
        const skyItem = skyItems.find(s => s.fcstTime === item.fcstTime);
        const skyText = skyItem ? skyCodeMap[skyItem.fcstValue] : '';
        
        // 습도 값
        const humidityItem = humidityItems.find(h => h.fcstTime === item.fcstTime);
        const humidity = humidityItem ? parseFloat(humidityItem.fcstValue) : null;
    
        return {
          time: [time, skyText],    // X축: 시간 + 하늘상태
          temperature: parseFloat(item.fcstValue), // 기온
          humidity: humidity,       // 습도
        };
      });
    } else {
      result = targetItems.map(item => ({
        time: `${item.fcstTime.slice(0, 2)}:${item.fcstTime.slice(2, 4)}`,
        value: parseFloat(item.fcstValue),
      }));
    }
  
    setSelectedCategory(category);
    setSelectedLabel(label);
    setChartData1(result);
  }, [forecastData]);
  
  
  useEffect(() => {
    if (forecastData.length > 0 && selectedSigngu) {
      handleClick(selectedCategory, selectedLabel);
    }
  }, [forecastData, selectedSigngu, handleClick, selectedCategory, selectedLabel]);
  




  // ---------------------------------------------------------------------------------------------------------------------------------
  // 관광지역 방문자수 추이 및 예측 정보 대시보드
  // ---------------------------------------------------------------------------------------------------------------------------------
  const [items, setItems] = useState([]); // ✅ 추가 필요
  const [chartData2, setChartData2] = useState([]);
  const [selectedTourName, setSelectedTourName] = useState('');
  
  useEffect(() => {


    const fetchLinkRateData = async () => {
      if (!selectedSigngu) return;
      
      const { data, error } = await handleApi(getTourPrediction, {
        numOfRows: 6000,
        pageNo: 1,
        MobileOS: 'ETC',
        MobileApp: 'AppTest',
        areaCd: 48,
        signguCd: signgureaIdMap[selectedSigngu],
        _type: 'json',
      });
    
      if (error) {
        console.error(error);
        return;
      }
      
      const res = data.response.body.items?.item || [];

      if (res.length > 0) {
        setItems(res); // ✅ 원본 저장
        setSelectedTourName(res[0].tAtsNm); // ✅ 초기 선택값 설정
      }
    
    };
  
    fetchLinkRateData();
  }, [selectedSigngu]);
  
  // ✅ 관광지 목록 (select용)
  const uniqueTourNames = [...new Set(items.map(item => item.tAtsNm))];
  
  // ✅ 관광지 선택 시 해당 데이터만 추출
  useEffect(() => {
    if (!selectedTourName || items.length === 0) return;
  
    const result = items
      .filter(item => item.tAtsNm === selectedTourName && item.cnctrRate && item.baseYmd)
      .sort((a, b) => a.baseYmd.localeCompare(b.baseYmd))
      .map(item => ({
        time: `${item.baseYmd.slice(4, 6)}/${item.baseYmd.slice(6, 8)}`,
        value: parseFloat(item.cnctrRate),
      }));
  
    setChartData2(result);
  }, [selectedTourName, items]);

  
  // ---------------------------------------------------------------------------------------------------------------------------------
  // 날씨 데이터 시각화 옵션 설정
  // ---------------------------------------------------------------------------------------------------------------------------------
  const createGradient1 = (ctx, area) => {
    const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, 'rgba(255, 180, 40, 0.3)');  // 상단
    gradient.addColorStop(1, 'rgba(255, 99, 132,0.5)');  // 하단
    return gradient;
  };

  const createGradient2 = (ctx, area) => {
    const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, 'rgba(53, 101, 233, 0.3)');  // 상단
    gradient.addColorStop(1, 'rgba(255, 99, 132,0.5)');  // 하단
    return gradient;
  };

  const createGradientPre = (ctx, area) => {
    const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, 'rgba(53, 101, 233, 0.05)');  // 상단
    gradient.addColorStop(1, 'rgba(53, 101, 233, 0.5)');  // 하단
    return gradient;
  };

  const lineData1 = {
    labels: chartData1.map(d => d.time),  // ['13:00', '맑음']
    datasets: [
      {
        label: '기온 (°C)',
        data: chartData1.map(d => d.temperature),
        yAxisID: 'y',
        borderWidth: 1,
        fill: true,
        pointBackgroundColor: 'rgb(246, 159, 59)',
        borderColor: 'rgb(246, 159, 59)',
        backgroundColor: (context) => {
          const {ctx, chartArea} = context.chart;
          if (!chartArea) return null;
          return createGradient1(ctx, chartArea);
        },
        tension: 0.2,
      },
      {
        label: '습도 (%)',
        data: chartData1.map(d => d.humidity),
        yAxisID: 'y1',
        type: 'line', // 또는 'bar'로 바꿔도 됨
        borderWidth: 1,
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: true,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: (context) => {
          const {ctx, chartArea} = context.chart;
          if (!chartArea) return null;
          return createGradient2(ctx, chartArea);
        },
        tension: 0.2,
      },
    ],
  };
  

  
  const lineOptions1 = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false,
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: '기온 (°C)',
        },
        ticks: {
          color: 'rgb(59, 130, 246)', // 파란색 기온축
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: '습도 (%)',
        },
        grid: {
          drawOnChartArea: false, // 오른쪽 격자선 비활성화
        },
        ticks: {
          color: 'rgba(75, 192, 192, 1)', // 청록색 습도축
        },
      },
    },
  };


  const precipitationData = {
    labels: chartData1.map(d => d.time),
    datasets: [
      {
        label: '강수량(mm)',
        data: chartData1.map(d => d.value),
        borderWidth: 1,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: (context) => {
          const {ctx, chartArea} = context.chart;
          if (!chartArea) return null; // chart가 아직 렌더링되지 않았을 때 방지
          return createGradientPre(ctx, chartArea);
        },
        tension: .2
      },
    ],
  };


  const precipitationOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        display: false, // 👈 라벨 완전히 숨김
      }
    },
    scales: {
      y: {
        beginAtZero: true, // ✅ y축 0부터 시작
      },
    },
  };
  


  // ---------------------------------------------------------------------------------------------------------------------------------
  // 방문자 추이예측 데이터 시각화 옵션 설정  (집중률: 최대 방문자 수 대비 예측 방문자수 비율인듯)
  // ---------------------------------------------------------------------------------------------------------------------------------
  const values = chartData2.map(d => d.value);
  const minY = Math.max(0, Math.floor(Math.min(...values)) - 5);
  const maxY = Math.min(100, Math.ceil(Math.max(...values)) + 5);
  
  const createGradient3 = (ctx, area) => {
    const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, 'rgba(16,185,29,0.05)');  // 상단
    gradient.addColorStop(1, 'rgba(16,185,29,0.5)');  // 하단
    return gradient;
  };

  const lineData2 = {
    labels: chartData2.map(d => d.time), 
    datasets: [
      {
        label: `관광지 방문자 추이 (${selectedTourName})`, 
        data: chartData2.map(d => d.value),   
        borderWidth: 1,
        fill: true,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: (context) => {
          const {ctx, chartArea} = context.chart;
          if (!chartArea) return null; // chart가 아직 렌더링되지 않았을 때 방지
          return createGradient3(ctx, chartArea);
        },
        tension: .2
      },
    ],
  };
  
  const lineOptions2 = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500, // 0보다 크면 부드럽게
      easing: 'easeOutQuart', // 원하는 easing 타입
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `집중률: ${context.parsed.y}%`,
        },
      },
      datalabels: {
        color: '#000',
        font: {
          size: 12,
          weight: 'bold',
        },
        align: (context) => {
          const value = context.dataset.data[context.dataIndex];
          return value < 5 ? 'bottom' : 'top'; // 5보다 작으면 아래, 아니면 위
        },
        offset: 4,
        formatter: (value) => `${value.toFixed(1)}%`,
        clip: false,
      }
    },
    scales: {
      x: {
        title: {
          display: false,
        },
      },
      y: {
        min: minY,
        max: maxY,
        title: {
          display: true,
          text: '집중률 (%)',
        },
      },
    },
    layout: {
      padding: {
        top: 20, // 윗쪽 공간 확보
        bottom: 20,
      },
    },
  };


  // ---------------------------------------------------------------------------------------------------------------------------------
  // 트리맵 차트
  // ---------------------------------------------------------------------------------------------------------------------------------

  const [bubbleData, setBubbleData] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  
  const resolvedRegion = useMemo(() => {
    return changwonAreas.includes(selectedSigngu) ? '통합창원시' : selectedSigngu;
  }, [selectedSigngu]);
  
  useEffect(() => {
    if (!resolvedRegion) return;
  
    const fetchData = async () => {
      const { data, error } = await handleApi(fetchTouristQuery, resolvedRegion);
      if (error) {
        setErrorMessage(error);
      } else {
        setBubbleData(data.places);
        setErrorMessage('');
      }
    };
  
    fetchData();
  }, [resolvedRegion]);
  
  const rootLabel = `${resolvedRegion} 작년 동월 관광지 방문 분포`;
  
  const chartData4 = [
    ["Location", "Parent", "Visitors"],
    [rootLabel, null, 0], // 루트 노드
    ...bubbleData.map(d => [d.name, rootLabel, d.visitors]),
  ];

  const options4 = {
    minColor: "#e0f7fa",
    midColor: "#80deea",
    maxColor: "#00796b",
    headerHeight: 20,
    fontColor: "black",
    generateTooltip: (row) => {
      return `
        <div style="background:#ffffff; padding:5px; border-style:solid">
          <span style="font-family:Courier">
            <b>${chartData4[row + 1][0]}</b><br/>
            방문자 수: ${chartData4[row + 1][2].toLocaleString()}명
          </span><br/>
        </div>
      `;
    },
    // showScale: true,
  };

  
  
  // ---------------------------------------------------------------------------------------------------------------------------------
  // 웹 화면 설계
  // ---------------------------------------------------------------------------------------------------------------------------------

  return (
    <div className="h-full w-full overflow-visible">
      {/* 🔹 Dashboard 영역 */}
      {selected && (
        <div className="flex flex-1 h-full">
          {/* Main Grid */}
          <div className="flex-1 overflow-auto p-4 grid grid-cols-3 grid-rows-[minmax(300px,_1fr)_minmax(250px,_1fr)] gap-6 ml-5">
            {/* 날씨예보 */}
            <div class="p-6 flex flex-col min-w-0 mb-0 lg:mb-0 break-words bg-gray-50 dark:bg-gray-800 w-full shadow-lg rounded">
              <div className="h-full rounded-t mb-0 px-0 border-0 bg-white">
                <div className="flex flex-wrap items-center px-4 py-2">
                  <div className="relative w-full max-w-full flex-grow flex-1">
                    <h2 className="text-xl font-semibold mb-2">📍 날씨 예보</h2>
                  </div>
                </div>
                <div className="p-6 block w-full h-full overflow-x-auto">
                  <div className="flex gap-2 mb-0 mt-0">
                    <button onClick={() => handleClick('T1H', '기온')}>기온</button>
                    <button onClick={() => handleClick('RN1', '강수량')}>강수량</button>
                  </div>
                  {selectedCategory === 'T1H' && chartData1.length > 0 && (
                    <div style={{ width: '100%', height: '80%' }}>
                      <Line data={lineData1} options={lineOptions1} />
                    </div>
                  )}

                  {selectedCategory === 'RN1' && chartData1.length > 0 && (
                    <div style={{ width: '100%', height: '80%' }}>
                      <Line data={precipitationData} options={precipitationOptions} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 지도 */}
            <div className="bg-transparent p-4 relative col-start-2 row-start-1">
              <motion.div
                layoutId="map"
                className="w-full h-full"
              >
                <GyungnamMap
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={(e) => {
                    const pathEl = e.target.closest('path');
                    if (pathEl) {
                      // 기존 선택 해제
                      document.querySelectorAll('svg path').forEach((el) => {
                        el.classList.remove('selected');
                      });

                      const signguId = pathEl.getAttribute('id');
                      if (signguId) {
                        setSelectedSigngu(signguNameFromSlug[signguId] || signguId);
                      }
                    }
                  }}
                />
              </motion.div>
            </div>
            

            {/* 방문자 수 데이터 */}
            <div class="p-6 flex flex-col min-w-0 mb-4 lg:mb-0 break-words bg-gray-50 dark:bg-gray-800 w-full shadow-lg rounded">
              <div className="h-full rounded-t mb-0 px-0 border-0 bg-white">
                <div className="h-full bg-white p-4">
                  <h2 className="text-xl font-semibold mb-2">📍 {selectedSigngu} 방문자 데이터</h2>
                  {filteredChartData.length > 0 && (
                    <div className='p-4' style={{width: "100%" ,height: "90%"}}>
                      <ChartBar data={chartData} options={options} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 하단 통계 */}
            <div class="col-span-2 bg-white p-4 p-6 flex flex-col min-w-0 mb-0 lg:mb-0 break-words bg-gray-50 dark:bg-gray-800 w-full h-full shadow-lg rounded">
              <div className="rounded-t mb-6 px-0 border-0 bg-white">
                {/* 상단 제목 + 선택 박스 */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">관광지 집중률 추이 예측 ({selectedTourName})</h2>
                  <select
                    className="border px-3 py-2 rounded"
                    value={selectedTourName}
                    onChange={(e) => setSelectedTourName(e.target.value)}
                  >
                    <option value="">관광지를 선택하세요</option>
                    {uniqueTourNames.map((name, idx) => (
                      <option key={idx} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {chartData2.length > 0 ? (
                <div style={{ width: '100%', height: '90%' }}>
                  <Line data={lineData2} options={lineOptions2} />
                </div>
              ) : (
                <p>로딩 중...</p>
              )}
            </div>

            {/* 기타 정보 */}
            <div className="p-6 flex flex-col bg-white w-full shadow-lg rounded">
              <div className="flex-1 min-h-0 overflow-visible relative z-10">


                {errorMessage ? (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  ❗ {errorMessage}
                  </div>
                ) : (
                  <Chart
                    chartType="TreeMap"
                    width="100%"
                    height="100%"
                    data={chartData4}
                    options={options4}
                    chartEvents={[
                      {
                        eventName: "select",
                        callback: ({ chartWrapper }) => {
                          const chart = chartWrapper.getChart();
                          chart.setSelection([]);
                        },
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  );
  
}