const AlertModal = () => {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">ver 0.0.1 공지사항</h2>
        <p className="text-sm font-normal text-gray-700"> - 데이터에 대한 저작권은 한국관광공사 및 기상청에 있습니다.</p>
        <p className="text-sm font-normal text-gray-700"> - 날씨 예보 중 강수량의 경우 실제 강수향이 30mm 이상이면 전부 30으로 처리됩니다.</p>
        <p className="text-sm font-normal text-gray-700"> - 방문자 수 데이터는 한달 전 기준입니다.</p>
        <p className="text-sm font-normal text-gray-700"> - 소비자 성별 & 연령 별 소비 분포는 24.01 ~ 25.06 데이터의 종합치입니다.</p>
        <p className="text-sm font-normal text-gray-700"> - 외국인 소비 국가별 순위 top 10은 24.01 ~ 25.06 데이터의 종합치입니다.</p>
      </div>
    );
  };
  
  export default AlertModal;