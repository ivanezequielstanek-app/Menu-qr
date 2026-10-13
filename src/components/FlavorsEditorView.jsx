// Pantalla de sabores (solo interfaz). La usan el panel real y la demo.
import { useMemo, useState } from 'react'
import { groupFlavors, FLAVOR_GROUPS } from '../lib/flavors'
import { ConfirmModal, Empty, Modal, Switch } from './ui'
import { Plus, Edit, Trash, Up, Down } from './icons'

/**
 * props: flavors, onAdd([{ name, grp }]), onPatch(f, patch), onDelete(f), onMove(sortedGroupList, i, dir), onAllAvailable()
 */
export default function FlavorsEditorView({ flavors, onAdd, onPatch, onDelete, onMove, onAllAvailable }) {
  const groups = useMemo(() => groupFlavors(flavors), [flavors])
  const groupNames = useMemo(() => [...new Set([...groups.map((g) => g.name), ...FLAVOR_GROUPS])], [groups])
  const [name, setName] = useState('')
  const [grp, setGrp] = useState(groups[0]?.name || 'Cremas')
  const [bulk, setBulk] = useState(false)
  const [edit, setEdit] = useState(null)
  const [ask, setAsk] = useState(null)
  const out = flavors.filter((f) => f.available === false).length

  function addOne(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd([{ name: name.trim(), grp: grp.trim() || null }])
    setName('')
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Sabores</h1>
          <p className="muted">
            {flavors.length
              ? `${flavors.length} sabores${out ? ` · ${out} ${out === 1 ? 'agotado' : 'agotados'}` : ''}. Si se termina uno, apagalo y deja de aparecer para elegir.`
              : 'Los clientes los eligen en los productos que piden sabores, como 1 kg de helado o una promo de potes.'}
          </p>
        </div>
        <div className="page-actions">
          {out > 0 && <button className="btn btn-secondary" onClick={onAllAvailable}>Marcar todos disponibles</button>}
          <button className="btn btn-secondary" onClick={() => setBulk(true)}><Plus /> Agregar varios</button>
        </div>
      </div>

      <form className="card fl-add" onSubmit={addOne}>
        <label className="field"><span>Nuevo sabor</span>
          <input id="fl-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Dulce de leche granizado" enterKeyHint="done" />
        </label>
        <label className="field"><span>Grupo</span>
          <GroupInput id="fl-grp" value={grp} onChange={setGrp} options={groupNames} />
        </label>
        <button className="btn btn-primary" disabled={!name.trim()}><Plus /> Agregar</button>
      </form>

      {flavors.length === 0 && (
        <Empty title="Todavía no hay sabores" text="Cargalos de a uno o tocá «Agregar varios» y pegá la lista completa, un sabor por renglón."
          action={<button className="btn btn-primary" onClick={() => setBulk(true)}><Plus /> Agregar varios</button>} />
      )}

      {groups.map((g) => (
        <section key={g.name} className="cat-card">
          <header className="cat-head">
            <div className="cat-title"><h2>{g.name}</h2><span className="badge">{g.items.length}</span></div>
          </header>
          <ul className="prod-list">
            {g.items.map((f, i) => (
              <li key={f.id} className={`prod-row fl-row ${f.available === false ? 'is-out' : ''}`}>
                <button type="button" className="fl-name" onClick={() => setEdit(f)}>{f.name}</button>
                <div className="prod-tools fl-tools">
                  <Switch checked={f.available !== false} onChange={(v) => onPatch(f, { available: v })} label={f.available !== false ? 'Hay' : 'Agotado'} />
                  <div className="row-actions">
                    <button className="icon-btn" onClick={() => onMove(g.items, i, -1)} disabled={i === 0} aria-label="Subir"><Up /></button>
                    <button className="icon-btn" onClick={() => onMove(g.items, i, 1)} disabled={i === g.items.length - 1} aria-label="Bajar"><Down /></button>
                    <button className="icon-btn" onClick={() => setEdit(f)} aria-label="Editar"><Edit /></button>
                    <button className="icon-btn danger" onClick={() => setAsk(f)} aria-label="Eliminar"><Trash /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {bulk && <BulkModal groupNames={groupNames} defaultGroup={grp} onClose={() => setBulk(false)} onSave={(list) => { onAdd(list); setBulk(false) }} />}
      {edit && <EditModal flavor={edit} groupNames={groupNames} onClose={() => setEdit(null)} onSave={(patch) => { onPatch(edit, patch); setEdit(null) }} />}
      {ask && <ConfirmModal text={`¿Eliminar el sabor "${ask.name}"?`} onYes={() => onDelete(ask)} onClose={() => setAsk(null)} />}
    </div>
  )
}

function GroupInput({ id, value, onChange, options }) {
  return (
    <>
      <input id={id} className="input" list={`${id}-list`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Ej: Cremas" />
      <datalist id={`${id}-list`}>{options.map((g) => <option key={g} value={g} />)}</datalist>
    </>
  )
}

function BulkModal({ groupNames, defaultGroup, onClose, onSave }) {
  const [text, setText] = useState('')
  const [grp, setGrp] = useState(defaultGroup || '')
  const names = [...new Set(text.split(/\n|,/).map((x) => x.trim()).filter(Boolean))]
  return (
    <Modal title="Agregar varios sabores" onClose={onClose}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary btn-grow" disabled={!names.length}
          onClick={() => onSave(names.map((n) => ({ name: n.slice(0, 60), grp: grp.trim() || null })))}>
          {names.length ? `Agregar ${names.length}` : 'Agregar'}
        </button>
      </>}>
      <label className="field"><span>Sabores <em>(uno por renglón o separados por coma)</em></span>
        <textarea id="fl-bulk" className="input" rows={8} value={text} onChange={(e) => setText(e.target.value)} autoFocus
          placeholder={'Chocolate\nChocolate amargo\nDulce de leche\nDulce de leche granizado'} />
      </label>
      <label className="field"><span>Grupo para todos</span>
        <GroupInput id="fl-bulk-grp" value={grp} onChange={setGrp} options={groupNames} />
      </label>
      <p className="hint">Podés cargar cada grupo por separado: primero las cremas, después los chocolates, y así.</p>
    </Modal>
  )
}

function EditModal({ flavor, groupNames, onClose, onSave }) {
  const [name, setName] = useState(flavor.name)
  const [grp, setGrp] = useState(flavor.grp || '')
  return (
    <Modal title="Editar sabor" onClose={onClose} size="sm"
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" form="fl-edit" className="btn btn-primary btn-grow" disabled={!name.trim()}>Guardar</button>
      </>}>
      <form id="fl-edit" onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave({ name: name.trim(), grp: grp.trim() || null }) }}>
        <label className="field"><span>Nombre</span><input id="fl-edit-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
        <label className="field"><span>Grupo</span><GroupInput id="fl-edit-grp" value={grp} onChange={setGrp} options={groupNames} /></label>
      </form>
    </Modal>
  )
}
