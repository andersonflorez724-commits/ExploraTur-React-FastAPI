import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export function VentasBarChart({ data, title = 'Ventas por período' }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-center text-sm text-slate-400">No hay datos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)} />
          <Legend />
          <Bar dataKey="total" fill="#6366f1" name="Total Ventas" radius={[4, 4, 0, 0]} />
          <Bar dataKey="cantidad" fill="#06b6d4" name="N° Ventas" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function VentasLineChart({ data, title = 'Tendencia de ventas' }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-center text-sm text-slate-400">No hay datos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)} />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#6366f1" name="Total" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="cantidad" stroke="#10b981" name="Cantidad" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MensualBarChart({ data, title = 'Ventas mensuales' }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-center text-sm text-slate-400">No hay datos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)} />
          <Legend />
          <Bar dataKey="total" fill="#6366f1" name="Total COP" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ProductoPieChart({ data, title = 'Productos más vendidos' }) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-center text-sm text-slate-400">No hay datos disponibles.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 font-display text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="total_cantidad" nameKey="nombre" cx="50%" cy="50%" outerRadius={100} label={({ nombre, percent }) => `${nombre} (${(percent * 100).toFixed(0)}%)`}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value} unidades`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
