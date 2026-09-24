import { useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { apiGetDailyReport } from '../utils/api'
import { getLogoDataURL } from '../utils/logo'

const formatPrice = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

export default function ReportesPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [reporte, setReporte] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadReport = async () => {
    setLoading(true); setError('')
    try {
      const data = await apiGetDailyReport(fecha)
      setReporte(data)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const exportPDF = async () => {
    if (!reporte) return
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    const logo = await getLogoDataURL()
    const titleX = logo ? 34 : 14
    if (logo) doc.addImage(logo, 'PNG', 14, 12, 16, 16)

    doc.setFontSize(17)
    doc.text('ExploraTur', titleX, 20)
    doc.setFontSize(11)
    doc.text('Reporte Diario de Ventas', titleX, 27)

    doc.setFontSize(10)
    doc.text(`Fecha: ${reporte.fecha}`, 14, 40)
    doc.text(`Total Ventas: ${reporte.resumen.total_ventas}`, 14, 47)
    doc.text(`Total Ingresos: ${formatPrice(reporte.resumen.total_ingresos)}`, 14, 54)
    doc.text(`Impuestos: ${formatPrice(reporte.resumen.total_impuestos)}`, 14, 61)
    doc.text(`Descuentos: ${formatPrice(reporte.resumen.total_descuentos)}`, 14, 68)

    const rows = reporte.ventas.map(v => [
      v.numero_venta,
      v.hora,
      v.cliente,
      v.items.map(i => `${i.nombre} x${i.cantidad}`).join(', '),
      formatPrice(v.subtotal),
      formatPrice(v.impuestos || 0),
      formatPrice(v.descuento || 0),
      formatPrice(v.total),
      v.estado,
    ])

    autoTable(doc, {
      startY: 76,
      head: [['N° Venta', 'Hora', 'Cliente', 'Items', 'Subtotal', 'Impuestos', 'Descuento', 'Total', 'Estado']],
      body: rows,
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [99, 102, 241] },
      columnStyles: {
        0: { cellWidth: 17 },
        1: { cellWidth: 13 },
        4: { cellWidth: 21 },
        5: { cellWidth: 21 },
        6: { cellWidth: 21 },
        7: { cellWidth: 21 },
        8: { cellWidth: 17 },
      },
    })

    doc.save(`Reporte_Ventas_${fecha}.pdf`)
  }

  const exportExcel = async () => {
    if (!reporte) return
    const XLSX = await import('xlsx')

    const wsData = [
      ['ExploraTur - Reporte Diario de Ventas'],
      [`Fecha: ${reporte.fecha}`],
      [],
      ['N° Venta', 'Hora', 'Cliente', 'Items', 'Subtotal', 'Impuestos', 'Descuento', 'Total', 'Estado'],
    ]

    reporte.ventas.forEach(v => {
      wsData.push([
        v.numero_venta,
        v.hora,
        v.cliente,
        v.items.map(i => `${i.nombre} x${i.cantidad}`).join('; '),
        v.subtotal,
        v.impuestos,
        v.descuento,
        v.total,
        v.estado,
      ])
    })

    wsData.push([])
    wsData.push(['RESUMEN'])
    wsData.push(['Total Ventas', reporte.resumen.total_ventas])
    wsData.push(['Total Ingresos', reporte.resumen.total_ingresos])
    wsData.push(['Total Impuestos', reporte.resumen.total_impuestos])
    wsData.push(['Total Descuentos', reporte.resumen.total_descuentos])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    ws['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }]

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Ventas')
    XLSX.writeFile(wb, `Reporte_Ventas_${fecha}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>}

      <div className="flex items-end gap-3">
        <Input label="Fecha del reporte" type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-52" />
        <Button onClick={loadReport} disabled={loading}>{loading ? 'Cargando...' : 'Generar Reporte'}</Button>
        {reporte && (
          <>
            <Button variant="secondary" onClick={exportPDF}>Exportar PDF</Button>
            <Button variant="secondary" onClick={exportExcel}>Exportar Excel</Button>
          </>
        )}
      </div>

      {reporte && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Total Ventas</p>
              <p className="mt-1 font-display text-2xl font-bold text-brand-600">{reporte.resumen.total_ventas}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Ingresos Totales</p>
              <p className="mt-1 font-display text-2xl font-bold text-emerald-600">{formatPrice(reporte.resumen.total_ingresos)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Impuestos</p>
              <p className="mt-1 font-display text-2xl font-bold text-amber-600">{formatPrice(reporte.resumen.total_impuestos)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Descuentos</p>
              <p className="mt-1 font-display text-2xl font-bold text-rose-600">{formatPrice(reporte.resumen.total_descuentos)}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3">N° Venta</th>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Impuestos</th>
                  <th className="px-4 py-3">Descuento</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reporte.ventas.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{v.numero_venta}</td>
                    <td className="px-4 py-3 text-slate-500">{v.hora}</td>
                    <td className="px-4 py-3 text-slate-500">{v.cliente}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{v.items.map(i => `${i.nombre} x${i.cantidad}`).join(', ')}</td>
                    <td className="px-4 py-3 text-slate-500">{formatPrice(v.subtotal)}</td>
                    <td className="px-4 py-3 text-amber-600">{formatPrice(v.impuestos || 0)}</td>
                    <td className="px-4 py-3 text-rose-600">{formatPrice(v.descuento || 0)}</td>
                    <td className="px-4 py-3 font-semibold text-brand-600">{formatPrice(v.total)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      v.estado === 'Completada' ? 'bg-emerald-50 text-emerald-700' : v.estado === 'Cancelada' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>{v.estado}</span></td>
                  </tr>
                ))}
                {reporte.ventas.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No hay ventas para esta fecha.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
