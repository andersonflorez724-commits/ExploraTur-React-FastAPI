import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import DashboardLayout from '../components/DashboardLayout'
import StatsCard from '../components/StatsCard'
import { VentasBarChart, VentasLineChart, MensualBarChart, ProductoPieChart } from '../components/charts/DashboardCharts'
import VentasPage from './VentasPage'
import ReportesPage from './ReportesPage'
import PQRPage from './PQRPage'
import {
  apiGetProducts,
  apiCreateProduct,
  apiUpdateProduct,
  apiGetCategories,
  apiGetDashboardStats,
  apiGetSalesByPeriod,
  apiGetMonthlySales,
  apiGetSalesByProduct,
} from '../utils/api'
import { getSession } from '../utils/storage'

const INITIAL_PRODUCT = { nombre: '', descripcion: '', precio: '', categoria_id: '', stock: 0 }
const formatPrice = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

function EmpleadoPanel() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getSession())
  const [tab, setTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [productForm, setProductForm] = useState(INITIAL_PRODUCT)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dashStats, setDashStats] = useState(null)
  const [periodData, setPeriodData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [productSalesData, setProductSalesData] = useState([])
  const [chartPeriod, setChartPeriod] = useState('diario')
  const [chartFechaInicio, setChartFechaInicio] = useState('')
  const [chartFechaFin, setChartFechaFin] = useState('')

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('session-changed', sync)
    return () => window.removeEventListener('session-changed', sync)
  }, [])

  useEffect(() => {
    if (!user || (user.rol !== 'Empleado' && user.rol !== 'Administrador')) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (user && (user.rol === 'Empleado' || user.rol === 'Administrador')) {
      loadProducts(); loadCategories(); loadDashStats()
    }
  }, [user])

  useEffect(() => {
    if (tab === 'dashboard') loadDashStats()
    if (tab === 'productos') { loadProducts(); loadCategories() }
  }, [tab])

  const loadDashStats = async () => {
    try { const d = await apiGetDashboardStats(); setDashStats(d) } catch {}
    try {
      const params = { periodo: chartPeriod }
      if (chartFechaInicio) params.fecha_inicio = chartFechaInicio
      if (chartFechaFin) params.fecha_fin = chartFechaFin
      const p = await apiGetSalesByPeriod(params); setPeriodData(p.datos || [])
    } catch {}
    try { const m = await apiGetMonthlySales(); setMonthlyData(m.datos || []) } catch {}
    try { const prodData = await apiGetSalesByProduct(); setProductSalesData(prodData.productos || []) } catch {}
  }

  const loadProducts = async () => {
    try { const params = search ? { busqueda: search } : {}; const data = await apiGetProducts(params); setProducts(data.productos) }
    catch (err) { setError(err.message) }
  }
  const loadCategories = async () => { try { const data = await apiGetCategories(); setCategories(data.categorias) } catch {} }

  const handleSearch = (e) => { e.preventDefault(); loadProducts() }

  const handleProductSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    const payload = { ...productForm, precio: parseFloat(productForm.precio) || 0, stock: parseInt(productForm.stock) || 0 }
    try {
      if (editProduct) { await apiUpdateProduct(editProduct.id, payload); setSuccess('Producto actualizado.') }
      else { await apiCreateProduct(payload); setSuccess('Producto creado.') }
      setProductModal(false); setEditProduct(null); setProductForm(INITIAL_PRODUCT); loadProducts()
    } catch (err) { setError(err.message) }
  }

  const handleEditProduct = (p) => {
    setEditProduct(p)
    setProductForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoria_id: p.categoria_id || '', stock: p.stock || 0 })
    setProductModal(true)
  }

  if (!user || (user.rol !== 'Empleado' && user.rol !== 'Administrador')) return null

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'productos', label: 'Productos', icon: '📦' },
    { id: 'ventas', label: 'Ventas', icon: '💰' },
    { id: 'reportes', label: 'Reportes', icon: '📋' },
    { id: 'pqr', label: 'PQR', icon: '📨' },
  ]

  const activeProducts = products.filter((p) => p.estado === 'Activo').length

  const sectionTitle = {
    dashboard: 'Dashboard',
    productos: 'Gestión de Productos',
    ventas: 'Ventas',
    reportes: 'Reportes Diarios',
    pqr: 'PQR',
  }

  return (
    <DashboardLayout
      navItems={navItems}
      activeSection={tab}
      onSectionChange={(id) => { setTab(id); setError(''); setSuccess('') }}
      title={sectionTitle[tab]}
      subtitle="Consulta, agrega y edita productos del catálogo."
      accentColor="cyan"
    >
      {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">⚠️ {error}</div>}
      {success && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">✅ {success}</div>}

      {/* ========== DASHBOARD ========== */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard icon="📦" label="Total Productos" value={dashStats?.total_productos || products.length} color="cyan" subtitle={`${activeProducts} activos`} />
            <StatsCard icon="✅" label="Productos Activos" value={activeProducts} color="emerald" />
            <StatsCard icon="💰" label="Total Ventas" value={dashStats?.total_ventas || 0} color="violet" />
            <StatsCard icon="📨" label="PQR Pendientes" value={dashStats?.pqr_pendientes || 0} color="rose" />
          </div>

          {/* Filtros de gráficos */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Período</label>
              <select value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha Inicio</label>
              <input type="date" value={chartFechaInicio} onChange={(e) => setChartFechaInicio(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha Fin</label>
              <input type="date" value={chartFechaFin} onChange={(e) => setChartFechaFin(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
            <Button onClick={loadDashStats}>Aplicar filtros</Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <VentasBarChart data={periodData} title={`Ventas por período (${chartPeriod === 'diario' ? 'Diario' : chartPeriod === 'semanal' ? 'Semanal' : 'Mensual'})`} />
            <VentasLineChart data={periodData} title="Tendencia de ventas" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <MensualBarChart data={monthlyData} title="Ventas mensuales" />
            <ProductoPieChart data={productSalesData} title="Productos más vendidos" />
          </div>
        </div>
      )}

      {/* ========== TAB PRODUCTOS ========== */}
      {tab === 'productos' && (
        <div>
          <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos..." maxLength={100} className="sm:w-80" />
            <Button type="submit">Buscar</Button>
            <Button variant="ghost" type="button" onClick={() => { setEditProduct(null); setProductForm(INITIAL_PRODUCT); setProductModal(true) }}>+ Agregar producto</Button>
            <Button variant="ghost" type="button" onClick={loadProducts}>Actualizar</Button>
          </form>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article key={p.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{p.nombre}</h3>
                    <p className="mt-1 text-xs text-slate-400">{p.categoria_nombre || 'Sin categoría'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{p.estado}</span>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{p.descripcion}</p>
                <p className="mt-2 font-display text-lg font-bold text-brand-600 dark:text-brand-400">{formatPrice(p.precio)}</p>
                <p className="text-xs text-slate-400">Stock: {p.stock}</p>
                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button onClick={() => handleEditProduct(p)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 cursor-pointer">✏️ Editar</button>
                </div>
              </article>
            ))}
            {products.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
                No se encontraron productos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== TAB VENTAS ========== */}
      {tab === 'ventas' && <VentasPage />}

      {/* ========== TAB REPORTES ========== */}
      {tab === 'reportes' && <ReportesPage />}

      {/* ========== TAB PQR ========== */}
      {tab === 'pqr' && <PQRPage />}

      {/* Modal producto */}
      <Modal open={productModal} onClose={() => { setProductModal(false); setEditProduct(null) }} title={editProduct ? 'Editar producto' : 'Crear producto'} wide>
        <form onSubmit={handleProductSubmit} className="space-y-3">
          <Input label="Nombre" name="nombre" value={productForm.nombre} onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })} required maxLength={200} />
          <Input label="Descripción" name="descripcion" value={productForm.descripcion} onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })} maxLength={1000} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Precio (COP)" name="precio" type="number" value={productForm.precio} onChange={(e) => setProductForm({ ...productForm, precio: e.target.value })} required />
            <Input label="Stock" name="stock" type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
            <Select label="Categoría" name="categoria_id" value={productForm.categoria_id} onChange={(e) => setProductForm({ ...productForm, categoria_id: e.target.value })} options={[{ value: '', label: 'Sin categoría' }, ...categories.map((c) => ({ value: c.id, label: c.nombre }))]} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" fullWidth>{editProduct ? 'Guardar cambios' : 'Crear producto'}</Button>
            <Button variant="ghost" type="button" onClick={() => { setProductModal(false); setEditProduct(null) }}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}

export default EmpleadoPanel
