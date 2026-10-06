import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase, imageUrl } from '../lib/supabase'
import { themeById } from '../lib/designs'
import MenuView from '../menu/MenuView'

export default function PublicMenu() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let alive = true
    async function load() {
      const { data: r, error } = await supabase.from('restaurants')
        .select('id, slug, name, tagline, whatsapp, logo_path').eq('slug', slug).maybeSingle()
      if (!alive) return
      if (error || !r) return setState({ status: 'missing' })
      const [d, c, p] = await Promise.all([
        supabase.from('restaurant_design').select('theme, options').eq('restaurant_id', r.id).maybeSingle(),
        supabase.from('categories').select('id, name, position, visible').eq('restaurant_id', r.id).order('position'),
        supabase.from('products').select('id, category_id, name, description, price, image_path, available, featured, position')
          .eq('restaurant_id', r.id).order('position'),
      ])
      if (!alive) return
      setState({
        status: 'ok',
        restaurant: { ...r, logo_url: imageUrl(r.logo_path) },
        theme: d.data?.theme || 'elegante',
        options: d.data?.options || {},
        categories: c.data || [],
        products: (p.data || []).map((x) => ({ ...x, image_url: imageUrl(x.image_path) })),
      })
    }
    load()
    return () => { alive = false }
  }, [slug])

  // Fondo y color de la barra del navegador acordes al diseño
  useEffect(() => {
    if (state.status !== 'ok') return
    const bg = themeById(state.theme).bg
    document.documentElement.style.background = bg
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
    document.title = state.restaurant.name
    return () => { document.documentElement.style.background = '' }
  }, [state])

  if (state.status === 'loading') return <div className="page-center"><span className="spinner" /></div>
  if (state.status === 'missing') return (
    <div className="page-center">
      <div className="empty"><h3>Menú no disponible</h3><p>Revisá el enlace o consultá en el local.</p></div>
    </div>
  )

  async function submitOrder(order) {
    const { error } = await supabase.rpc('place_order', {
      p_slug: slug, p_type: order.type, p_table: order.table || null, p_name: order.name || null,
      p_address: order.address || null, p_notes: order.notes || null, p_items: order.items,
    })
    if (error) throw error
  }

  return (
    <MenuView
      restaurant={state.restaurant} theme={state.theme} options={state.options}
      categories={state.categories} products={state.products}
      initialTable={params.get('mesa') || ''} onSubmitOrder={submitOrder}
    />
  )
}
