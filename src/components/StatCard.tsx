interface StatCardProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
  badge?: string
}

export default function StatCard({ label, value, sub, accent, badge }: StatCardProps) {
  return (
    <div className="card card-hover p-4 md:p-6">
      <div className="flex items-start justify-between mb-2">
        <p className="text-muted text-sm">{label}</p>
        {badge && (
          <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <p
        className={`stat-number text-2xl font-bold ${
          accent ? 'text-accent' : 'text-white'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-muted text-sm mt-1">{sub}</p>}
    </div>
  )
}
