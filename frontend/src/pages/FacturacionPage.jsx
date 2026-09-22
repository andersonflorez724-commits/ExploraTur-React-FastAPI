import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import {
  apiGetInvoices, apiCreateInvoice, apiGetInvoiceById, apiUpdateInvoiceStatus, apiGetSales,
} from '../utils/api'

const formatPrice = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState([])
  const [ventas, setVentas] = useState([])
  const [facturaModal, setFacturaModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState(null)
  const [form, setForm] = useState({ venta_id: '', cliente_id: '' })
  const [filters, setFilters] = useState({ estado: '', busqueda: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { loadFacturas(); loadVentas() }, [])

  const loadFacturas = async (params = {}) => {
    try { const d = await apiGetInvoices(params); setFacturas(d.facturas) }
    catch (err) { setError(err.message) }
  }
  const loadVentas = async () => {
    try { const d = await apiGetSales({ estado: 'Confirmada' }); setVentas(d.ventas.filter(v => !facturas.find(f => f.venta_id === v.id))) }
    catch {}
  }

  const clearMessages = () => { setError(''); setSuccess('') }

  const handleFilter = () => {
    const params = {}
    if (filters.estado) params.estado = filters.estado
    if (filters.busqueda) params.busqueda = filters.busqueda
    loadFacturas(params)
  }

  const handleCreate = async (e) => {
    e.preventDefault(); clearMessages()
    if (!form.venta_id) { setError('Selecciona una venta.'); return }
    try {
      await apiCreateInvoice({ venta_id: parseInt(form.venta_id), cliente_id: form.cliente_id ? parseInt(form.cliente_id) : null })
      setSuccess('Factura generada exitosamente.')
      setFacturaModal(false); setForm({ venta_id: '', cliente_id: '' })
      loadFacturas(); loadVentas()
    } catch (err) { setError(err.message) }
  }

  const handleViewDetail = async (factura) => {
    try {
      const d = await apiGetInvoiceById(factura.id)
      setSelectedFactura(d.factura)
      setDetailModal(true)
    } catch (err) { setError(err.message) }
  }

  const handleUpdateStatus = async (id, estado) => {
    clearMessages()
    try { await apiUpdateInvoiceStatus(id, estado); setSuccess('Estado actualizado.'); loadFacturas() }
    catch (err) { setError(err.message) }
  }

  const downloadInvoicePDF = async (factura) => {
    try {
      const d = await apiGetInvoiceById(factura.id)
      const f = d.factura
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.text('ExploraTur', 14, 20)
      doc.setFontSize(10)
      doc.text('NIT: 900.123.456-7', 14, 26)
      doc.text('Bogotá, Colombia | info@exploratur.com', 14, 31)

      doc.setFontSize(16)
      doc.text(`FACTURA ${f.numero_factura}`, 14, 44)

      doc.setFontSize(10)
      doc.text(`Fecha: ${f.created_at ? new Date(f.created_at).toLocaleDateString('es-CO') : ''}`, 14, 54)
      doc.text(`Estado: ${f.estado}`, 14, 60)
      doc.text(`Cliente: ${f.cliente_nombre || 'Consumidor final'}`, 14, 66)
      doc.text(`Vendedor: ${f.usuario_nombre || 'N/A'}`, 14, 72)

      if (f.detalles_venta && f.detalles_venta.length > 0) {
        const rows = f.detalles_venta.map(d => [d.tipo, d.nombre, d.cantidad, formatPrice(d.precio_unitario), formatPrice(d.descuento), formatPrice(d.subtotal)])
        autoTable(doc, {
          startY: 80,
          head: [['Tipo', 'Descripción', 'Cant.', 'Precio U.', 'Descuento', 'Subtotal']],
          body: rows,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [99, 102, 241] },
        })
      }

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 100
      doc.setFontSize(10)
      doc.text(`Subtotal: ${formatPrice(f.subtotal)}`, 130, finalY + 10)
      doc.text(`Impuestos: ${formatPrice(f.impuestos)}`, 130, finalY + 16)
      doc.text(`Descuento: -${formatPrice(f.descuento)}`, 130, finalY + 22)
      doc.setFontSize(12)
      doc.text(`TOTAL: ${formatPrice(f.total)}`, 130, finalY + 30)

      doc.setFontSize(8)
      doc.text('Gracias por su compra en ExploraTur.', 14, finalY + 40)

      doc.save(`${f.numero_factura}.pdf`)
    } catch (err) { setError('Error al generar PDF: ' + err.message) }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>}
      {success && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">{success}</div>}

      <div className="flex flex-wrap items-end gap-3">
        <Select label="Estado" value={filters.estado} onChange={e => setFilters({ ...filters, estado: e.target.value })} options={[{ value: '', label: 'Todos' }, { value: 'Pendiente', label: 'Pendiente' }, { value: 'Pagada', label: 'Pagada' }, { value: 'Anulada', label: 'Anulada' }]} className="w-40" />
        <Input label="Buscar" value={filters.busqueda} onChange={e => setFilters({ ...filters, busqueda: e.target.value })} placeholder="N° Factura o cliente..." className="w-56" />
        <Button onClick={handleFilter} variant="secondary">Filtrar</Button>
        <Button onClick={() => { setForm({ venta_id: '', cliente_id: '' }); setFacturaModal(true) }}>+ Generar Factura</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">N° Factura</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {facturas.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{f.numero_factura}</td>
                <td className="px-4 py-3 text-slate-500">{f.created_at ? new Date(f.created_at).toLocaleDateString('es-CO') : ''}</td>
                <td className="px-4 py-3 text-slate-500">{f.cliente_nombre || 'Consumidor final'}</td>
                <td className="px-4 py-3 font-semibold text-brand-600">{formatPrice(f.total)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    f.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700' : f.estado === 'Anulada' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>{f.estado}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleViewDetail(f)} className="rounded-lg px-2 py-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 cursor-pointer">Ver</button>
                    <button onClick={() => downloadInvoicePDF(f)} className="rounded-lg px-2 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 cursor-pointer">PDF</button>
                    {f.estado === 'Pendiente' && <button onClick={() => handleUpdateStatus(f.id, 'Pagada')} className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 cursor-pointer">Pagada</button>}
                  </div>
                </td>
              </tr>
            ))}
            {facturas.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay facturas registradas.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Factura */}
      <Modal open={facturaModal} onClose={() => setFacturaModal(false)} title="Generar Factura">
        <form onSubmit={handleCreate} className="space-y-3">
          <Select label="Venta" value={form.venta_id} onChange={e => setForm({ ...form, venta_id: e.target.value })} options={[{ value: '', label: 'Seleccionar venta...' }, ...ventas.map(v => ({ value: v.id, label: `${v.numero_venta || `VTA-${v.id}`} - ${formatPrice(v.total)}` }))]} />
          <p className="text-xs text-slate-400">Solo se muestran ventas confirmadas sin factura.</p>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>Generar Factura</Button>
            <Button variant="ghost" type="button" onClick={() => setFacturaModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle Factura */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Detalle de Factura" wide>
        {selectedFactura && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-slate-500">N° Factura:</span> {selectedFactura.numero_factura}</div>
              <div><span className="font-medium text-slate-500">Fecha:</span> {selectedFactura.created_at ? new Date(selectedFactura.created_at).toLocaleString('es-CO') : ''}</div>
              <div><span className="font-medium text-slate-500">Cliente:</span> {selectedFactura.cliente_nombre || 'Consumidor final'}</div>
              <div><span className="font-medium text-slate-500">Estado:</span> <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                selectedFactura.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>{selectedFactura.estado}</span></div>
            </div>

            {selectedFactura.detalles_venta && selectedFactura.detalles_venta.length > 0 && (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Descripción</th><th className="px-3 py-2">Cant.</th><th className="px-3 py-2">Precio</th><th className="px-3 py-2">Subtotal</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedFactura.detalles_venta.map((d, i) => (
                    <tr key={i}><td className="px-3 py-2">{d.tipo}</td><td className="px-3 py-2">{d.nombre}</td><td className="px-3 py-2">{d.cantidad}</td><td className="px-3 py-2">{formatPrice(d.precio_unitario)}</td><td className="px-3 py-2 font-medium">{formatPrice(d.subtotal)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-end space-x-6 border-t pt-3 text-sm font-bold">
              <span>Subtotal: {formatPrice(selectedFactura.subtotal)}</span>
              <span>Impuestos: {formatPrice(selectedFactura.impuestos)}</span>
              <span>Descuento: -{formatPrice(selectedFactura.descuento)}</span>
              <span className="text-brand-600">TOTAL: {formatPrice(selectedFactura.total)}</span>
            </div>

            <div className="flex gap-3 border-t pt-3">
              <Button onClick={() => downloadInvoicePDF(selectedFactura)} variant="secondary">Descargar PDF</Button>
              {selectedFactura.estado === 'Pendiente' && <Button onClick={async () => { await handleUpdateStatus(selectedFactura.id, 'Pagada'); setDetailModal(false) }}>Marcar como Pagada</Button>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
