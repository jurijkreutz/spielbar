interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

export default function StatCard({ label, value, color = 'text-zinc-900' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
