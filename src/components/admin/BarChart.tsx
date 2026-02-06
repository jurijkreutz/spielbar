interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
}

export default function BarChart({ data, title }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-zinc-600">{item.label}</span>
              <span className="text-sm font-medium text-zinc-900">{item.value}</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${item.color}`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
