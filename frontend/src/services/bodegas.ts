import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import { normalizar } from '../lib/texto'
import type { Titular } from './usuarios'

/**
 * Gestión de bodegas (admin/super_admin) — real contra Supabase: renombrar bodegas, asignar
 * líder de la sede, asignar operario principal/secundario por bodega, y vincular productos del
 * catálogo global a una bodega (con carga masiva por Excel). La visibilidad por rol (admin ve
 * todas, líder ve las de su sede, operario ve las suyas) la resuelve RLS — este servicio no
 * filtra nada por rol, solo pide los datos y devuelve lo que la base permita ver.
 */

export interface BodegaAdmin {
  id: string
  nombre: string
  siteId: string
  siteNombre: string
}

export async function listarBodegasAdmin(): Promise<BodegaAdmin[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('id, name, site_id, sites(name)')
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((w) => {
    const site = Array.isArray(w.sites) ? w.sites[0] : w.sites
    return { id: w.id, nombre: w.name, siteId: w.site_id, siteNombre: site?.name ?? '' }
  })
}

export async function renombrarBodega(warehouseId: string, nuevoNombre: string): Promise<void> {
  const { error } = await supabase.from('warehouses').update({ name: nuevoNombre }).eq('id', warehouseId)
  if (error) throw new Error(error.message)
}

export async function getLiderDeSede(siteId: string): Promise<{ id: string; nombre: string } | null> {
  const { data, error } = await supabase
    .from('sites')
    .select('leader_id, profiles(full_name, email)')
    .eq('id', siteId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data?.leader_id) return null
  const perfil = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  return { id: data.leader_id, nombre: perfil?.full_name ?? perfil?.email ?? 'Desconocido' }
}

/** Reasigna el líder de la SEDE a la que pertenece la bodega — aplica a todas las bodegas de esa sede. */
export async function asignarLiderDeSede(siteId: string, profileId: string): Promise<void> {
  const { error } = await supabase.from('sites').update({ leader_id: profileId }).eq('id', siteId)
  if (error) throw new Error(error.message)
}

/** Candidatos a líder de sede: perfiles operario o lider (a quien se reasigna, el trigger de la
 * base promueve/degrada el rol automáticamente). */
export async function listarCandidatosLider(): Promise<{ id: string; nombre: string }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .in('role', ['operario', 'lider'])
    .order('full_name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({ id: p.id, nombre: p.full_name ?? p.email }))
}

/**
 * Operarios candidatos para asignar a una bodega de esta sede: rol operario, excluyendo a
 * quienes ya están atados a bodegas de OTRA sede (el trigger enforce_single_site_operario los
 * rechazaría igual; esto solo evita ofrecer opciones inválidas en el selector).
 */
export async function listarOperariosDisponibles(siteId: string): Promise<{ id: string; nombre: string }[]> {
  const { data: operarios, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'operario')
    .order('full_name')
  if (error) throw new Error(error.message)

  const { data: asignados, error: asignError } = await supabase
    .from('warehouse_operators')
    .select('operario_id, site_id')
  if (asignError) throw new Error(asignError.message)

  const otraSede = new Set(
    (asignados ?? []).filter((a) => a.site_id !== siteId).map((a) => a.operario_id),
  )
  return (operarios ?? [])
    .filter((o) => !otraSede.has(o.id))
    .map((o) => ({ id: o.id, nombre: o.full_name ?? o.email }))
}

/** Principal/secundario actuales de UNA bodega (subconjunto de getTitularesDeBodegas). */
export async function getOperariosDeBodega(
  warehouseId: string,
): Promise<{ principal?: Titular; revisor?: Titular }> {
  const { data, error } = await supabase
    .from('warehouse_operators')
    .select('assignment_role, operario_id, profiles(full_name, email)')
    .eq('warehouse_id', warehouseId)
  if (error) throw new Error(error.message)
  const resultado: { principal?: Titular; revisor?: Titular } = {}
  for (const row of data ?? []) {
    const perfil = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const titular: Titular = { id: row.operario_id, nombre: perfil?.full_name ?? perfil?.email ?? 'Desconocido' }
    if (row.assignment_role === 'principal') resultado.principal = titular
    else resultado.revisor = titular
  }
  return resultado
}

/**
 * Fija el operario Principal y Secundario de ESTA bodega (borra lo que hubiera antes en esos dos
 * roles para esta bodega e inserta lo nuevo). Bloquea con error si el operario elegido ya tiene
 * ese mismo rol en OTRA bodega (regla: solo 1 principal + 1 secundario por bodega, globalmente).
 */
export async function asignarOperariosDeBodega(
  warehouseId: string,
  principalId: string | null,
  revisorId: string | null,
): Promise<void> {
  const candidatos = [
    principalId && { operarioId: principalId, rol: 'principal' as const },
    revisorId && { operarioId: revisorId, rol: 'revisor' as const },
  ].filter((x): x is { operarioId: string; rol: 'principal' | 'revisor' } => Boolean(x))

  if (candidatos.length > 0) {
    const { data: existentes, error: checkError } = await supabase
      .from('warehouse_operators')
      .select('warehouse_id, assignment_role, operario_id, profiles(full_name, email), warehouses(name)')
      .eq('assignment_role', 'principal')
      .neq('warehouse_id', warehouseId)
    if (checkError) throw new Error(checkError.message)

    const { data: existentesRevisor, error: checkError2 } = await supabase
      .from('warehouse_operators')
      .select('warehouse_id, assignment_role, operario_id, profiles(full_name, email), warehouses(name)')
      .eq('assignment_role', 'revisor')
      .neq('warehouse_id', warehouseId)
    if (checkError2) throw new Error(checkError2.message)

    const todos = [...(existentes ?? []), ...(existentesRevisor ?? [])]
    for (const c of candidatos) {
      const conflicto = todos.find((e) => e.operario_id === c.operarioId && e.assignment_role === c.rol)
      if (conflicto) {
        const bodega = Array.isArray(conflicto.warehouses) ? conflicto.warehouses[0] : conflicto.warehouses
        const rolLabel = c.rol === 'principal' ? 'Principal' : 'Secundario'
        throw new Error(`Este operario ya es ${rolLabel} de ${bodega?.name ?? 'otra bodega'}. Quítalo primero.`)
      }
    }
  }

  const { error: delError } = await supabase
    .from('warehouse_operators')
    .delete()
    .eq('warehouse_id', warehouseId)
    .in('assignment_role', ['principal', 'revisor'])
  if (delError) throw new Error(delError.message)

  if (candidatos.length === 0) return

  const { error: insError } = await supabase.from('warehouse_operators').insert(
    candidatos.map((c) => ({
      warehouse_id: warehouseId,
      operario_id: c.operarioId,
      assignment_role: c.rol,
    })),
  )
  if (insError) {
    if (insError.code === '23505') {
      throw new Error('Alguien más tomó ese rol mientras guardabas. Vuelve a intentarlo.')
    }
    if (insError.message.includes('ya está asignado a bodegas de otra sede')) {
      throw new Error('Ese operario ya está asignado a bodegas de otra sede. Desasígnalo primero.')
    }
    throw new Error(insError.message)
  }
}

export interface ProductoBodega {
  productId: string
  nombre: string
  sku: string | null
  unidad: string
  currentStock: number
}

export async function listarProductosDeBodega(warehouseId: string): Promise<ProductoBodega[]> {
  const { data, error } = await supabase
    .from('warehouse_products')
    .select('product_id, current_stock, products(name, sku, unit)')
    .eq('warehouse_id', warehouseId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => {
    const producto = Array.isArray(row.products) ? row.products[0] : row.products
    return {
      productId: row.product_id,
      nombre: producto?.name ?? row.product_id,
      sku: producto?.sku ?? null,
      unidad: producto?.unit ?? '',
      currentStock: row.current_stock,
    }
  })
}

export interface ProductoCatalogo {
  id: string
  nombre: string
  sku: string | null
  unidad: string
}

/** Busca en el catálogo GLOBAL de productos ACTIVOS (para vincular uno existente a esta bodega;
 * los inhabilitados no se ofrecen para nuevos vínculos). */
export async function buscarProductosCatalogo(query: string): Promise<ProductoCatalogo[]> {
  const q = normalizar(query)
  if (!q) return []
  const { data, error } = await supabase.from('products').select('id, name, sku, unit').eq('active', true).limit(200)
  if (error) throw new Error(error.message)
  return (data ?? [])
    .filter((p) => normalizar(p.name).includes(q) || (p.sku && normalizar(p.sku).includes(q)))
    .slice(0, 20)
    .map((p) => ({ id: p.id, nombre: p.name, sku: p.sku, unidad: p.unit }))
}

export async function agregarProductoABodega(warehouseId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('warehouse_products')
    .upsert({ warehouse_id: warehouseId, product_id: productId }, { onConflict: 'warehouse_id,product_id' })
  if (error) throw new Error(error.message)
}

export async function quitarProductoDeBodega(warehouseId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('warehouse_products')
    .delete()
    .eq('warehouse_id', warehouseId)
    .eq('product_id', productId)
  if (error) throw new Error(error.message)
}

/** Descarga una plantilla .xlsx vacía (con un ejemplo) para cargar productos de una bodega. */
export function descargarPlantillaProductos(): void {
  const filas = [{ 'Nr.Artículo': '95006025', Artículo: 'ARAGAN MEDIANO 51 CMS C/PALO', Unidad: 'Unidad', SD: 12 }]
  const ws = XLSX.utils.json_to_sheet(filas, { header: ['Nr.Artículo', 'Artículo', 'Unidad', 'SD'] })
  ws['!cols'] = [{ wch: 14 }, { wch: 42 }, { wch: 12 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  XLSX.writeFile(wb, 'plantilla_productos_bodega.xlsx')
}

interface FilaImportada {
  'Nr.Artículo'?: string | number
  Artículo?: string
  Unidad?: string
  SD?: number
}

export interface ResultadoCarga {
  cargados: number
  noEncontrados: string[]
}

/**
 * Carga un Excel con columnas Nr.Artículo/Artículo/Unidad/SD y vincula cada fila a un producto YA
 * EXISTENTE en el catálogo global (match por sku, case-insensitive). Nunca crea productos nuevos:
 * las filas cuyo Nr.Artículo no matchee ningún products.sku existente se reportan como no encontradas.
 */
export async function cargarProductosDesdeExcel(warehouseId: string, file: File): Promise<ResultadoCarga> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const primeraHoja = wb.SheetNames[0]
  if (!primeraHoja) return { cargados: 0, noEncontrados: [] }
  const filas = XLSX.utils.sheet_to_json<FilaImportada>(wb.Sheets[primeraHoja])

  const skus = filas.map((f) => String(f['Nr.Artículo'] ?? '').trim()).filter(Boolean)
  if (skus.length === 0) return { cargados: 0, noEncontrados: [] }

  const { data: productos, error } = await supabase.from('products').select('id, sku').in('sku', skus)
  if (error) throw new Error(error.message)
  const porSku = new Map((productos ?? []).map((p) => [normalizar(p.sku ?? ''), p.id]))

  const paraInsertar: { warehouse_id: string; product_id: string; current_stock: number }[] = []
  const noEncontrados: string[] = []
  for (const fila of filas) {
    const sku = String(fila['Nr.Artículo'] ?? '').trim()
    if (!sku) continue
    const productId = porSku.get(normalizar(sku))
    if (!productId) {
      noEncontrados.push(sku)
      continue
    }
    paraInsertar.push({ warehouse_id: warehouseId, product_id: productId, current_stock: Number(fila.SD ?? 0) })
  }

  if (paraInsertar.length > 0) {
    const { error: upsertError } = await supabase
      .from('warehouse_products')
      .upsert(paraInsertar, { onConflict: 'warehouse_id,product_id' })
    if (upsertError) throw new Error(upsertError.message)
  }

  return { cargados: paraInsertar.length, noEncontrados }
}
