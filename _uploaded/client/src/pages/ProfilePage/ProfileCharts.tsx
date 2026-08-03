import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { logger } from '@lark-apaas/client-toolkit/logger';

interface PieDataItem {
  name: string;
  value: number;
}

interface ModulePieChartProps {
  data: PieDataItem[];
  colors?: string[];
}

const DEFAULT_PIE_COLORS = [
  '#A8E6CF', // 识字-浅绿
  '#D5AAFF', // 拼音-浅紫
  '#FFD3B6', // 古诗-浅橙
  '#A0E7E5', // 英语-浅青
  '#B4D8FF', // 数学-浅蓝
  '#FFF1A8', // 科普-浅黄
];

export function ModulePieChart({ data, colors = DEFAULT_PIE_COLORS }: ModulePieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    try {
      chartInstance.current = echarts.init(chartRef.current);
      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}分钟 ({d}%)',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#f0e6d6',
          textStyle: { color: '#4a4a6a', fontSize: 12 },
        },
        legend: {
          bottom: 0,
          left: 'center',
          itemWidth: 12,
          itemHeight: 12,
          itemGap: 12,
          textStyle: { color: '#6b7280', fontSize: 12 },
        },
        color: colors,
        series: [
          {
            name: '学习时长',
            type: 'pie',
            radius: ['40%', '65%'],
            center: ['50%', '42%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold',
                color: '#4a4a6a',
                formatter: '{b}\n{c}分钟',
              },
            },
            labelLine: {
              show: false,
            },
            data: data.map((item) => ({
              name: item.name,
              value: item.value,
            })),
          },
        ],
      };
      chartInstance.current.setOption(option);

      const handleResize = () => {
        chartInstance.current?.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstance.current?.dispose();
        chartInstance.current = null;
      };
    } catch (error) {
      logger.error('饼图初始化失败', error);
    }
  }, [data, colors]);

  return <div ref={chartRef} className="w-full h-64" />;
}

interface WeeklyTrendChartProps {
  dates: string[];
  minutes: number[];
}

export function WeeklyTrendChart({ dates, minutes }: WeeklyTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    try {
      chartInstance.current = echarts.init(chartRef.current);
      const option: echarts.EChartsOption = {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>学习时长: {c}分钟',
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderColor: '#f0e6d6',
          textStyle: { color: '#4a4a6a', fontSize: 12 },
        },
        grid: {
          left: '8%',
          right: '5%',
          top: '12%',
          bottom: '12%',
          containLabel: false,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates.map((d) => d.slice(5)),
          axisLine: {
            lineStyle: { color: '#e5e7eb' },
          },
          axisLabel: {
            color: '#9ca3af',
            fontSize: 11,
          },
          axisTick: { show: false },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: '#9ca3af',
            fontSize: 11,
            formatter: '{value}',
          },
          splitLine: {
            lineStyle: { color: '#f3f4f6', type: 'dashed' },
          },
        },
        series: [
          {
            name: '学习时长',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              color: '#7CB7FF',
              width: 3,
            },
            itemStyle: {
              color: '#7CB7FF',
              borderColor: '#fff',
              borderWidth: 2,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(124, 183, 255, 0.4)' },
                { offset: 1, color: 'rgba(124, 183, 255, 0.05)' },
              ]),
            },
            data: minutes,
          },
        ],
      };
      chartInstance.current.setOption(option);

      const handleResize = () => {
        chartInstance.current?.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstance.current?.dispose();
        chartInstance.current = null;
      };
    } catch (error) {
      logger.error('折线图初始化失败', error);
    }
  }, [dates, minutes]);

  return <div ref={chartRef} className="w-full h-56" />;
}
