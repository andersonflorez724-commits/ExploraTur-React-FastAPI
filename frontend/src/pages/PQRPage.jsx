import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import {
  apiGetPQRs, apiCreatePQR, apiUpdatePQRStatus, apiAssignPQR, apiGetPQRStats, apiGetUsers,
} from '../utils/api'
import { getSession } from '../utils/storage'

export default function PQRPage() {
  const [user] = useState(() => getSession())
  const [pqrList, setPqrList] = useState([])
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedPQR, setSelectedPQR] = useState(null)
  const [form, setForm] = useState({ tipo: 'Peticion', asunto: '', descripcion: '' })
  const [filters, setFilters] = useState({ estado: '', tipo: '', busqueda: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isAdmin = user?.rol === 'Administrador'

  useEffect(() => { loadPQRs(); if (isAdmin) { loadStats(); loadUsers() } }, [])

  const loadPQRs = async (params = {}) => {
    try { const d = await apiGetPQRs(params); setPqrList(d.pqr) }
    catch (err) { setError(err.message) }
  }
  const loadStats = async () => {
    try { const d = await apiGetPQRStats(); setStats(d) }
    catch (err) { console.error('Error al cargar estadísticas PQR:', err) }
  }
  const loadUsers = async () => { try { const d = await apiGetUsers(); setUsers(d.usuarios) } catch {} }

  const clearMessages = () => { setError(''); setSuccess('') }

  const handleFilter = () => {
    const params = {}
    if (filters.estado) params.estado = filters.estado
    if (filters.tipo) params.tipo = filters.tipo
    if (filters.busqueda) params.busqueda = filters.busqueda
    loadPQRs(params)
  }

  const handleCreate = async (e) => {
    e.preventDefault(); clearMessages()
    try {
      await apiCreatePQR(form)
      setSuccess('PQR registrado exitosamente.')
      setCreateModal(false); setForm({ tipo: 'Peticion', asunto: '', descripcion: '' })
      loadPQRs()
      if (isAdmin) loadStats()
    } catch (err) { setError(err.message) }
  }

  const handleViewDetail = (pqr) => { setSelectedPQR(pqr); setDetailModal(true) }

  const handleUpdateStatus = async (id, estado, respuesta = '') => {
    clearMessages()
    try { await apiUpdatePQRStatus(id, { estado, respuesta }); setSuccess('Estado actualizado.'); loadPQRs(); setDetailModal(false) }
    catch (err) { setError(err.message) }
  }

  const handleAssign = async (pqrId, userId) => {
    clearMessages()
    try { await apiAssignPQR(pqrId, userId); setSuccess('PQR asignado.'); loadPQRs() }
    catch (err) { setError(err.message) }
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>}
      {success && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">{success}</div>}

      {/* Stats */}
      {isAdmin && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Total PQR</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Pendientes</p>
            <p className="text-xl font-bold text-amber-600">{stats.por_estado?.Pendiente || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">En Proceso</p>
            <p className="text-xl font-bold text-cyan-600">{stats.por_estado?.['En Proceso'] || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Respondidas</p>
            <p className="text-xl font-bold text-emerald-600">{stats.por_estado?.Respondida || 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Cerradas</p>
            <p className="text-xl font-bold text-slate-600">{stats.por_estado?.Cerrada || 0}</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <Select label="Tipo" value={filters.tipo} onChange={e => setFilters({ ...filters, tipo: e.target.value })} options={[{ value: '', label: 'Todos' }, { value: 'Peticion', label: 'Petición' }, { value: 'Queja', label: 'Queja' }, { value: 'Reclamo', label: 'Reclamo' }, { value: 'Solicitud', label: 'Solicitud' }]} className="w-40" />
        <Select label="Estado" value={filters.estado} onChange={e => setFilters({ ...filters, estado: e.target.value })} options={[{ value: '', label: 'Todos' }, { value: 'Pendiente', label: 'Pendiente' }, { value: 'En Proceso', label: 'En Proceso' }, { value: 'Respondida', label: 'Respondida' }, { value: 'Cerrada', label: 'Cerrada' }]} className="w-40" />
        <Input label="Buscar" value={filters.busqueda} onChange={e => setFilters({ ...filters, busqueda: e.target.value })} placeholder="N° PQR o asunto..." className="w-56" />
        <Button onClick={handleFilter} variant="secondary">Filtrar</Button>
        <Button onClick={() => { setForm({ tipo: 'Peticion', asunto: '', descripcion: '' }); setCreateModal(true) }}>+ Nuevo PQR</Button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {pqrList.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.tipo === 'Peticion' ? 'bg-cyan-50 text-cyan-700' : p.tipo === 'Queja' ? 'bg-amber-50 text-amber-700' : p.tipo === 'Reclamo' ? 'bg-rose-50 text-rose-700' : 'bg-violet-50 text-violet-700'
                  }`}>{p.tipo}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.estado === 'Pendiente' ? 'bg-amber-50 text-amber-700' : p.estado === 'En Proceso' ? 'bg-cyan-50 text-cyan-700' : p.estado === 'Respondida' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>{p.estado}</span>
                  <span className="text-xs text-slate-400">{p.numero_pqr}</span>
                </div>
                <h3 className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{p.asunto}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{p.descripcion}</p>
                <p className="mt-1 text-xs text-slate-400">Cliente: {p.cliente_nombre || 'N/A'} | {p.created_at ? new Date(p.created_at).toLocaleDateString('es-CO') : ''}</p>
                {p.respuesta && <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><strong>Respuesta:</strong> {p.respuesta}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => handleViewDetail(p)} className="rounded-lg px-3 py-1 text-xs font-medium text-cyan-600 hover:bg-cyan-50 cursor-pointer">Ver detalle</button>
                {isAdmin && p.estado !== 'Cerrada' && (
                  <select onChange={(e) => { if (e.target.value) handleAssign(p.id, parseInt(e.target.value)) }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700" defaultValue="">
                    <option value="">Asignar...</option>
                    {users.filter(u => u.rol_nombre !== 'Cliente').map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
        {pqrList.length === 0 && <p className="py-8 text-center text-slate-400">No hay PQR registrados.</p>}
      </div>

      {/* Modal Crear PQR */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Registrar PQR">
        <form onSubmit={handleCreate} className="space-y-3">
          <Select label="Tipo" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} options={[{ value: 'Peticion', label: 'Petición' }, { value: 'Queja', label: 'Queja' }, { value: 'Reclamo', label: 'Reclamo' }, { value: 'Solicitud', label: 'Solicitud' }]} />
          <Input label="Asunto" value={form.asunto} onChange={e => setForm({ ...form, asunto: e.target.value })} required maxLength={200} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Descripción *</label>
            <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} required rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" placeholder="Describe tu solicitud detalladamente..." />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>Registrar PQR</Button>
            <Button variant="ghost" type="button" onClick={() => setCreateModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle PQR */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Detalle del PQR" wide>
        {selectedPQR && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${selectedPQR.tipo === 'Peticion' ? 'bg-cyan-50 text-cyan-700' : selectedPQR.tipo === 'Queja' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{selectedPQR.tipo}</span>
              <span className="text-xs text-slate-400">{selectedPQR.numero_pqr}</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-800 dark:text-slate-100">{selectedPQR.asunto}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedPQR.descripcion}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-slate-500">Cliente:</span> {selectedPQR.cliente_nombre}</div>
              <div><span className="font-medium text-slate-500">Estado:</span> <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                selectedPQR.estado === 'Pendiente' ? 'bg-amber-50 text-amber-700' : selectedPQR.estado === 'En Proceso' ? 'bg-cyan-50 text-cyan-700' : selectedPQR.estado === 'Respondida' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>{selectedPQR.estado}</span></div>
              <div><span className="font-medium text-slate-500">Asignado a:</span> {selectedPQR.usuario_asignado_nombre || 'Sin asignar'}</div>
              <div><span className="font-medium text-slate-500">Fecha:</span> {selectedPQR.created_at ? new Date(selectedPQR.created_at).toLocaleString('es-CO') : ''}</div>
            </div>

            {selectedPQR.respuesta && (
              <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Respuesta:</p>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">{selectedPQR.respuesta}</p>
              </div>
            )}

            {isAdmin && selectedPQR.estado !== 'Cerrada' && (
              <div className="flex gap-3 border-t pt-3">
                {selectedPQR.estado === 'Pendiente' && <Button onClick={() => handleUpdateStatus(selectedPQR.id, 'En Proceso')} variant="secondary">Iniciar proceso</Button>}
                <Button onClick={() => {
                  const respuesta = prompt('Ingrese la respuesta al PQR:')
                  if (respuesta) handleUpdateStatus(selectedPQR.id, 'Respondida', respuesta)
                }}>Responder</Button>
                <Button onClick={() => handleUpdateStatus(selectedPQR.id, 'Cerrada')} variant="danger">Cerrar PQR</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
