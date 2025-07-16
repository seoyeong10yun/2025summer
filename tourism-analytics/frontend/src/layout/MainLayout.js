import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Newspaper, SquareChevronRight, Upload, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { ReactComponent as GyungnamMap } from '../assets/gyungnam-map.svg';
import { regionNameFromSlug } from '../assets/regionMap';
import AlertModal from '../pages/AlertModal';
import AdminModal from "../pages/AdminModal";
import AiReportModal from '../pages/AiReportModal';

import "font-awesome/css/font-awesome.min.css";


export default function MainLayout() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const [selected, setSelected] = useState(() => {
      return sessionStorage.getItem("introSeen") === "true";
  });
  

  const [selectedRegion, setSelectedRegion] = useState(null);
  // 값이 바뀔 때마다 세션에 저장
  useEffect(() => {
    if (selectedRegion) {
      sessionStorage.setItem("selectedRegion", selectedRegion);
    }
  }, [selectedRegion]);


  const [show, setShow] = useState(false);

  // 마우스 위치 감지
  useEffect(() => {
    const handleMouseMove = (e) => {
      setShow(e.clientX < 80);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);






  return (
    <div className="h-screen w-full overflow-hidden bg-white">
      {/* 🔹 인트로 화면 */}
      <AnimatePresence>
        {!selected && (
          <motion.div
            key="intro"
            layoutId="mapWrapper"
            className="fixed top-0 left-0 w-screen h-screen z-50 bg-white flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-3xl font-bold mb-8">KOREA TOUR DATA</h1>

            <motion.div
              layoutId="map"
              className="w-[80%] max-w-[600px] cursor-pointer"
              onClick={(e) => {
                const pathEl = e.target.closest('path');
                const regionId = pathEl?.id;
                if (regionId) {
                  setSelectedRegion(regionNameFromSlug[regionId] || regionId);
                  setSelected(true);
                  sessionStorage.setItem("introSeen", "true");

                  // 이동 후 약간 지연되게 색상 적용
                  setTimeout(() => {
                    const targetPath = document.querySelector(`svg path[id="${regionId}"]`);
                    if (targetPath) {
                      document.querySelectorAll('svg path').forEach((el) => el.classList.remove('selected'));
                      targetPath.classList.add('selected');
                    }
                  }, 1000); // 모션 이동 시간(ms)에 맞게 조절 (예: 500ms)
                }
              }}  
            >
              <GyungnamMap className="w-full h-auto" />
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {selected && (
          <>
          {/* Wrapper */}
          <div className="flex h-screen">
            {/* ▶ 항상 보이는 힌트 아이콘 */}
            {!show && (
              <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
                <div className="bg-transparent dark:bg-slate-800 rounded-r-md p-1">
                  <SquareChevronRight className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                </div>
              </div>
            )}

          <AnimatePresence>
          {show && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 flex items-center w-30 p-3 bg-transparent rounded-r-xl z-50"
            >
              <div className="w-30 relative bg-transparent dark:bg-slate-900 pattern">
                <nav className="z-20 flex shrink-0 grow-0 justify-around gap-4 border-t border-gray-200 bg-white/50 p-2.5 shadow-lg backdrop-blur-lg dark:border-slate-600/60 dark:bg-slate-800/50 left-6 min-h-[auto] min-w-[48px] flex-col rounded-lg border">
                  <button onClick={() => navigate("/dashboard")}>
                    <div className="flex aspect-square min-h-[32px] w-16 flex-col items-center justify-center gap-1 rounded-md p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 hover:text-cyan-500 cursor-pointer">
                      <LayoutDashboard className="w-6 h-6"/>
                      <small className="text-center text-xs font-medium">대시보드</small>
                    </div>
                  </button>
                  

                  <button onClick={() => setIsReportOpen(true)} >
                    <div className="flex aspect-square min-h-[32px] w-16 flex-col items-center justify-center gap-1 rounded-md p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 hover:text-cyan-500 cursor-pointer">
                      <Newspaper className="w-6 h-6"/>
                      <small className="text-center text-xs font-medium">AI 리포트</small>
                    </div>
                  </button>
                  
                  <button onClick={() => setIsModalOpen(true)}>
                    <div className="flex aspect-square min-h-[32px] w-16 flex-col items-center justify-center gap-1 rounded-md p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 hover:text-cyan-500 cursor-pointer">
                      <Upload className="w-6 h-6" />
                      <small className="text-center text-xs font-medium">업로드</small>
                    </div>
                  </button>
                </nav>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
          {/* Main Area */}
          <div className="flex flex-col flex-1">
            {/* Header */}
            <div className="h-16 bg-[#00BFFF] px-6 flex items-center justify-between shadow font-semibold text-lg shadow">
              <div></div>
              <h2 class="font-bold text-2xl">KOREA <span class="bg-[#3B82F6] text-white px-2 rounded-md">TOUR</span> DATA</h2>
              <button onClick={() => setIsAlertOpen(true)}>
                <div className="flex aspect-square min-h-[32px] w-12 flex-col items-center justify-center gap-1 rounded-md p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800 hover:text-cyan-500 cursor-pointer">
                <Megaphone className="w-12 h-12"/>
                </div>
              </button>

              {/* ✅ 모달 */}
              {isAlertOpen && (
                <div
                  className="fixed inset-0 z-[999] grid h-screen w-screen place-items-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300"
                  onClick={() => setIsAlertOpen(false)} // 바깥 클릭 시 닫힘
                >
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-lg max-w-screen-sm w-auto shadow-lg">
                      <AlertModal /> {/* 이 안에 알림 페이지 내용 */}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Page Content */}
            <div className="flex-1 overflow-auto p-4 bg-[#f3f4f6] dark:bg-gray-800">
              <Outlet />
            </div>

            <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}/>
            <AiReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />

          </div>
        </div>
      </>
      )};
    </div>
  );
}
