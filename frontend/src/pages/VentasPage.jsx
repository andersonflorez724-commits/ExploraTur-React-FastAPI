import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import {
  apiCreateSale, apiGetSales, apiGetProducts, apiGetServices, apiGetUsers, apiUpdateSaleStatus,
} from '../utils/api'

const formatPrice = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

const INITIAL_SALE = {
  cliente_id: '',
  descuento: 0,
  impuestos: 0,
  observaciones: '',
}

export default function VentasPage({ onNavigate }) {
  const [ventas, setVentas] = useState([])
  const [products, setProducts] = useState([])
  const [services, setServices] = useState([])
  const [users, setUsers] = useState([])
  const [saleModal, setSaleModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState(null)
  const [saleForm, setSaleForm] = useState(INITIAL_SALE)
  const [detalles, setDetalles] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState({ fecha_inicio: '', fecha_fin: '', estado: '', busqueda: '' })

  useEffect(() => { loadSales(); loadProducts(); loadServices(); loadUsers() }, [])

  const loadSales = async (params = {}) => {
    try {
      const data = await apiGetSales(params)
      setVentas(data.ventas)
    } catch (err) { setError(err.message) }
  }
  const loadProducts = async () => { try { const d = await apiGetProducts(); setProducts(d.productos) } catch {} }
  const loadServices = async () => { try { const d = await apiGetServices(); setServices(d.servicios) } catch {} }
  const loadUsers = async () => { try { const d = await apiGetUsers(); setUsers(d.usuarios.filter(u => u.rol_nombre === 'Cliente')) } catch {} }

  const clearMessages = () => { setError(''); setSuccess('') }

  const handleFilter = () => {
    const params = {}
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin
    if (filters.estado) params.estado = filters.estado
    if (filters.busqueda) params.busqueda = filters.busqueda
    loadSales(params)
  }

  const addDetalle = (tipo) => {
    setDetalles([...detalles, { tipo_item: tipo, item_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }])
  }

  const updateDetalle = (index, field, value) => {
    const updated = [...detalles]
    updated[index][field] = value

    if (field === 'item_id' && updated[index].tipo_item) {
      const list = updated[index].tipo_item === 'Producto' ? products : services
      const item = list.find(i => i.id === parseInt(value))
      if (item) updated[index].precio_unitario = item.precio
    }
    setDetalles(updated)
  }

  const removeDetalle = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const calcSubtotal = () => {
    return detalles.reduce((acc, d) => acc + (d.precio_unitario * d.cantidad - d.descuento), 0)
  }

  const handleCreateSale = async (e) => {
    e.preventDefault(); clearMessages()
    if (detalles.length === 0) { setError('Agrega al menos un item.'); return }

    try {
      const payload = {
        cliente_id: saleForm.cliente_id ? parseInt(saleForm.cliente_id) : null,
        detalles: detalles.map(d => ({
          tipo_item: d.tipo_item,
          item_id: parseInt(d.item_id),
          cantidad: parseInt(d.cantidad),
          precio_unitario: parseFloat(d.precio_unitario),
          descuento: parseFloat(d.descuento) || 0,
        })),
        descuento: parseFloat(saleForm.descuento) || 0,
        impuestos: parseFloat(saleForm.impuestos) || 0,
        observaciones: saleForm.observaciones,
      }
      await apiCreateSale(payload)
      setSuccess('Venta creada exitosamente.')
      setSaleModal(false); setSaleForm(INITIAL_SALE); setDetalles([])
      loadSales()
    } catch (err) { setError(err.message) }
  }

  const handleViewDetail = (venta) => { setSelectedVenta(venta); setDetailModal(true) }

  const handleUpdateStatus = async (id, estado) => {
    clearMessages()
    try { await apiUpdateSaleStatus(id, estado); setSuccess('Estado actualizado.'); loadSales() }
    catch (err) { setError(err.message) }
  }

  const clientes = users.filter(u => u.rol_nombre === 'Cliente')

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">{error}</div>}
      {success && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">{success}</div>}

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <Input label="Fecha Inicio" type="date" value={filters.fecha_inicio} onChange={e => setFilters({ ...filters, fecha_inicio: e.target.value })} className="w-40" />
        <Input label="Fecha Fin" type="date" value={filters.fecha_fin} onChange={e => setFilters({ ...filters, fecha_fin: e.target.value })} className="w-40" />
        <Select label="Estado" value={filters.estado} onChange={e => setFilters({ ...filters, estado: e.target.value })} options={[{ value: '', label: 'Todos' }, { value: 'Pendiente', label: 'Pendiente' }, { value: 'Confirmada', label: 'Confirmada' }, { value: 'Completada', label: 'Completada' }, { value: 'Cancelada', label: 'Cancelada' }]} className="w-40" />
        <Input label="Buscar" value={filters.busqueda} onChange={e => setFilters({ ...filters, busqueda: e.target.value })} placeholder="Cliente..." className="w-48" />
        <Button onClick={handleFilter} variant="secondary">Filtrar</Button>
        <Button onClick={() => { setDetalles([]); setSaleForm(INITIAL_SALE); setSaleModal(true) }}>+ Nueva Venta</Button>
      </div>

      {/* Tabla de ventas */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3">N° Venta</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {ventas.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{v.numero_venta || `VTA-${v.id}`}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.created_at ? new Date(v.created_at).toLocaleDateString('es-CO') : ''}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.cliente_nombre || 'Sin cliente'}</td>
                <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">{formatPrice(v.total)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    v.estado === 'Completada' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' :
                    v.estado === 'Confirmada' ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300' :
                    v.estado === 'Cancelada' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' :
                    'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                  }`}>{v.estado}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleViewDetail(v)} className="rounded-lg px-2 py-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 cursor-pointer">Ver</button>
                    {v.estado === 'Pendiente' && <button onClick={() => handleUpdateStatus(v.id, 'Confirmada')} className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 cursor-pointer">Confirmar</button>}
                    {v.estado !== 'Cancelada' && v.estado !== 'Completada' && <button onClick={() => handleUpdateStatus(v.id, 'Cancelada')} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer">Cancelar</button>}
                  </div>
                </td>
              </tr>
            ))}
            {ventas.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay ventas registradas.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal Crear Venta */}
      <Modal open={saleModal} onClose={() => setSaleModal(false)} title="Registrar Nueva Venta" wide>
        <form onSubmit={handleCreateSale} className="space-y-4">
          <Select label="Cliente" value={saleForm.cliente_id} onChange={e => setSaleForm({ ...saleForm, cliente_id: e.target.value })} options={[{ value: '', label: 'Cliente general' }, ...clientes.map(c => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))]} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Items de la venta</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => addDetalle('Producto')}>+ Producto</Button>
                <Button type="button" variant="ghost" onClick={() => addDetalle('Servicio')}>+ Servicio</Button>
              </div>
            </div>

            {detalles.map((d, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">{d.tipo_item}</span>
                <Select value={d.item_id} onChange={e => updateDetalle(i, 'item_id', e.target.value)} options={
                  [{ value: '', label: 'Seleccionar...' },
                   ...(d.tipo_item === 'Producto' ? products : services).map(item => ({ value: item.id, label: `${item.nombre} - ${formatPrice(item.precio)}` }))]
                } className="w-56" />
                <Input type="number" value={d.cantidad} onChange={e => updateDetalle(i, 'cantidad', e.target.value)} placeholder="Cant." className="w-20" min="1" />
                <Input type="number" value={d.precio_unitario} onChange={e => updateDetalle(i, 'precio_unitario', e.target.value)} placeholder="Precio" className="w-32" />
                <Input type="number" value={d.descuento} onChange={e => updateDetalle(i, 'descuento', e.target.value)} placeholder="Desc." className="w-20" />
                <button type="button" onClick={() => removeDetalle(i)} className="rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer">X</button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Descuento Global" type="number" value={saleForm.descuento} onChange={e => setSaleForm({ ...saleForm, descuento: e.target.value })} />
            <Input label="Impuestos" type="number" value={saleForm.impuestos} onChange={e => setSaleForm({ ...saleForm, impuestos: e.target.value })} />
            <div className="flex items-end rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-800">
              <p className="text-sm font-bold text-brand-600">Total: {formatPrice(calcSubtotal() + parseFloat(saleForm.impuestos || 0) - parseFloat(saleForm.descuento || 0))}</p>
            </div>
          </div>

          <Input label="Observaciones" value={saleForm.observaciones} onChange={e => setSaleForm({ ...saleForm, observaciones: e.target.value })} placeholder="Notas de la venta..." />

          <div className="flex gap-3">
            <Button type="submit" fullWidth>Crear Venta</Button>
            <Button variant="ghost" type="button" onClick={() => setSaleModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle Venta */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Detalle de Venta" wide>
        {selectedVenta && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-slate-500">N° Venta:</span> {selectedVenta.numero_venta}</div>
              <div><span className="font-medium text-slate-500">Fecha:</span> {selectedVenta.created_at ? new Date(selectedVenta.created_at).toLocaleString('es-CO') : ''}</div>
              <div><span className="font-medium text-slate-500">Cliente:</span> {selectedVenta.cliente_nombre || 'General'}</div>
              <div><span className="font-medium text-slate-500">Vendedor:</span> {selectedVenta.usuario_nombre}</div>
              <div><span className="font-medium text-slate-500">Estado:</span> <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                selectedVenta.estado === 'Completada' ? 'bg-emerald-50 text-emerald-700' : selectedVenta.estado === 'Cancelada' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
              }`}>{selectedVenta.estado}</span></div>
            </div>

            {selectedVenta.detalles && selectedVenta.detalles.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Items:</p>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800"><tr><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Producto/Servicio</th><th className="px-3 py-2">Cant.</th><th className="px-3 py-2">Precio</th><th className="px-3 py-2">Subtotal</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedVenta.detalles.map((d, i) => (
                      <tr key={i}><td className="px-3 py-2">{d.tipo_item}</td><td className="px-3 py-2">{d.item_nombre}</td><td className="px-3 py-2">{d.cantidad}</td><td className="px-3 py-2">{formatPrice(d.precio_unitario)}</td><td className="px-3 py-2 font-medium">{formatPrice(d.subtotal)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end space-x-6 border-t pt-3 text-sm font-bold">
              <span>Subtotal: {formatPrice(selectedVenta.subtotal)}</span>
              <span>Impuestos: {formatPrice(selectedVenta.impuestos)}</span>
              <span>Descuento: -{formatPrice(selectedVenta.descuento)}</span>
              <span className="text-brand-600">Total: {formatPrice(selectedVenta.total)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
