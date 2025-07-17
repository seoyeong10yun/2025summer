import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

function BubbleForceChart({ data }) {
  const wrapperRef = useRef();
  const svgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        const { width, height } = wrapperRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;
    if (!data || data.length === 0 || !width || !height) return;

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const colorScale = d3.scaleOrdinal([
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
      '#E0BBE4', '#AFF8DB', '#FFC9DE', '#C1FFD7', '#D5AAFF',
    ]);

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.value) || 1])
      .range([20, Math.min(width, height) / 6]);

    const nodes = data.map((d, i) => ({
      ...d,
      radius: radiusScale(d.value),
      x: width / 2,
      y: height / 2,
      fx: i === 0 ? width / 2.5 : null,
      fy: i === 0 ? height / 2 : null,
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('center', d3.forceCenter(width / 2.5, height / 2))
      .force('x', d3.forceX(width / 2.5).strength(0.3))
      .force('y', d3.forceY(height / 2).strength(0.3))
      .force('collision', d3.forceCollide().radius(d => d.radius + 2))
      .on('tick', () => {
        svg.selectAll('circle')
          .data(nodes, d => d.id)
          .join('circle')
          .attr('r', d => d.radius)
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
          .attr('fill', d => colorScale(d.id))
          .attr('stroke', 'gray')
          .on('mouseover', (_, d) => {
            setTooltip({
              x: d.x,
              y: d.y - d.radius - 10,
              text: `${d.id}: ${d.value}`,
            });
          })
          .on('mouseout', () => setTooltip(null));

        svg.selectAll('text.label')
          .data(nodes, d => d.id)
          .join('text')
          .attr('class', 'label')
          .text(d => d.id)
          .attr('x', d => d.x)
          .attr('y', d => d.y + 5)
          .attr('text-anchor', 'middle')
          .attr('fill', 'black')
          .attr('font-size', '12px');
      });

    return () => simulation.stop();
  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} className="w-full h-full relative flex">
    {/* 왼쪽: SVG 차트 */}
    <div className="flex-1 relative">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip && (
        <div
          className="absolute px-2 py-1 bg-white border border-gray-300 rounded shadow text-sm text-black pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  
    {/* 오른쪽: 세로 중앙 정렬된 숫자 리스트 */}
    <div className="w-auto px-4 flex items-center justify-center border-l border-gray-300">
      <ul className="space-y-1 text-sm text-gray-700">
        {data
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((d) => (
            <li key={d.id} className="whitespace-nowrap">
              <span className="font-semibold">{d.id}</span>: {d.value}
            </li>
          ))}
      </ul>
    </div>
  </div>
  
  );
  
}

export default React.memo(BubbleForceChart, (prev, next) => {
  return JSON.stringify(prev.data) === JSON.stringify(next.data);
});
