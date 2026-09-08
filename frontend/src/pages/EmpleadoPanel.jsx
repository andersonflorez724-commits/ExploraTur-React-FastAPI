import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import {
  apiGetProducts,
  apiCreateProduct,
  apiUpdateProduct,
  apiGetCategories,
} from '../utils/api'
import { getSession } from '../utils/storage'

const INITIAL_PRODUCT = { nombre: '', descripcion: '', precio: '', categoria_id: '', stock: 0 }
const formatPrice = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v)

/**
 * Panel de Empleado: puede consultar y gestionar productos (CRUD limitado).
 * No tiene acceso a gestión de usuarios.
 */
function EmpleadoPanel() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getSession())
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [productForm, setProductForm] = useState(INITIAL_PRODUCT)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('session-changed', sync)
    return () => window.removeEventListener('session-changed', sync)
  }, [])

  useEffect(() => {
    if (!user || (user.rol !== 'Empleado' && user.rol !== 'Administrador')) {
      navigate('/login')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user && (user.rol === 'Empleado' || user.rol === 'Administrador')) {
      loadProducts()
      loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadProducts = async () => {
    try {
      const params = search ? { busqueda: search } : {}
      const data = await apiGetProducts(params)
      setProducts(data.productos)
    } catch (err) { setError(err.message) }
  }

  const loadCategories = async () => {
    try { const data = await apiGetCategories(); setCategories(data.categorias) } catch {}
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadProducts()
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('')
    const payload = { ...productForm, precio: parseFloat(productForm.precio) || 0, stock: parseInt(productForm.stock) || 0 }
    try {
      if (editProduct) {
        await apiUpdateProduct(editProduct.id, payload)
        setSuccess('Producto actualizado exitosamente.')
      } else {
        await apiCreateProduct(payload)
        setSuccess('Producto creado exitosamente.')
      }
      setProductModal(false); setEditProduct(null); setProductForm(INITIAL_PRODUCT); loadProducts()
    } catch (err) { setError(err.message) }
  }

  const handleEditProduct = (p) => {
    setEditProduct(p)
    setProductForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoria_id: p.categoria_id || '', stock: p.stock || 0 })
    setProductModal(true)
  }

  if (!user || (user.rol !== 'Empleado' && user.rol !== 'Administrador')) return null

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            Panel de Empleado
          </p>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Gestión de productos
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/85">
            Consulta, agrega y edita productos del catálogo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Buscador y acciones */}
        <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input name="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..." maxLength={100} className="sm:w-80" />
          <Button type="submit">Buscar</Button>
          <Button variant="ghost" type="button" onClick={() => { setEditProduct(null); setProductForm(INITIAL_PRODUCT); setProductModal(true) }}>+ Agregar producto</Button>
          <Button variant="ghost" type="button" onClick={loadProducts}>Actualizar</Button>
        </form>

        {error && <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">⚠️ {error}</div>}
        {success && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">✅ {success}</div>}

        {/* Lista de productos */}
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
      </section>

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
    </main>
  )
}

export default EmpleadoPanel
