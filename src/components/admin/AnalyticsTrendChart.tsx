'use client';

import { useMemo, useState } from 'react';

interface TrendPoint {
  date: string;
  visitors: number;
}

interface AnalyticsTrendChartProps {
  data: TrendPoint[];
}

const RANGE_OPTIONS = [
  { label: '7 Tage', days: 7 },
  { label: '14 Tage', days: 14 },
  { label: '30 Tage', days: 30 },
  { label: '1 Jahr', days: 365 },
] as const;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateKey: string, withYear = false): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    ...(withYear ? { year: '2-digit' } : {}),
  });
}

export default function AnalyticsTrendChart({ data }: AnalyticsTrendChartProps) {
  const [rangeDays, setRangeDays] = useState<number>(30);

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of data) {
      map.set(entry.date, entry.visitors);
    }
    return map;
  }, [data]);

  const chartData = useMemo(() => {
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (rangeDays - 1));

    const points: TrendPoint[] = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const key = toDateKey(cursor);
      points.push({
        date: key,
        visitors: dataMap.get(key) ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return points;
  }, [dataMap, rangeDays]);

  const totalVisitors = chartData.reduce((sum, point) => sum + point.visitors, 0);
  const avgPerDay = totalVisitors / Math.max(chartData.length, 1);
  const maxVisitors = Math.max(...chartData.map((point) => point.visitors), 1);
  const peakVisitors = Math.max(...chartData.map((point) => point.visitors), 0);

  const width = 900;
  const height = 300;
  const padding = { top: 18, right: 16, bottom: 32, left: 40 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const baselineY = padding.top + innerHeight;

  const pointCoordinates = chartData.map((point, index) => {
    const x =
      padding.left
      + (chartData.length === 1
        ? 0
        : (index / (chartData.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((point.visitors / maxVisitors) * innerHeight);
    return { x, y };
  });

  const linePoints = pointCoordinates.map((point) => `${point.x},${point.y}`).join(' ');

  const areaPath = pointCoordinates.length === 0
    ? ''
    : [
      `M ${pointCoordinates[0].x} ${baselineY}`,
      ...pointCoordinates.map((point) => `L ${point.x} ${point.y}`),
      `L ${pointCoordinates[pointCoordinates.length - 1].x} ${baselineY}`,
      'Z',
    ].join(' ');

  const firstDate = chartData[0]?.date;
  const middleDate = chartData[Math.floor(chartData.length / 2)]?.date;
  const lastDate = chartData[chartData.length - 1]?.date;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Besuchertrend</h3>
            <p className="text-sm text-zinc-500">
              Aggregierte, tägliche Besucher im ausgewählten Zeitraum
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setRangeDays(option.days)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  rangeDays === option.days
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Summe</p>
            <p className="text-xl font-semibold text-zinc-900">{totalVisitors}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Ø pro Tag</p>
            <p className="text-xl font-semibold text-zinc-900">{avgPerDay.toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Peak</p>
            <p className="text-xl font-semibold text-zinc-900">{peakVisitors}</p>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[640px]"
          role="img"
          aria-label="Besuchertrend als Liniendiagramm"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - (innerHeight * ratio);
            const value = Math.round(maxVisitors * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e4e4e7"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#71717a"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {areaPath && (
            <path
              d={areaPath}
              fill="url(#trendFill)"
              stroke="none"
            />
          )}

          {linePoints && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {pointCoordinates[pointCoordinates.length - 1] && (
            <circle
              cx={pointCoordinates[pointCoordinates.length - 1].x}
              cy={pointCoordinates[pointCoordinates.length - 1].y}
              r="4"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}

          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {firstDate && (
            <text
              x={padding.left}
              y={height - 8}
              textAnchor="start"
              fontSize="11"
              fill="#71717a"
            >
              {formatDate(firstDate, rangeDays >= 365)}
            </text>
          )}
          {middleDate && (
            <text
              x={padding.left + (innerWidth / 2)}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#71717a"
            >
              {formatDate(middleDate, rangeDays >= 365)}
            </text>
          )}
          {lastDate && (
            <text
              x={width - padding.right}
              y={height - 8}
              textAnchor="end"
              fontSize="11"
              fill="#71717a"
            >
              {formatDate(lastDate, rangeDays >= 365)}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
