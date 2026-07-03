import type { Etappe } from '../types'

interface Props {
  etappen: Etappe[]
  onChange: (etappen: Etappe[]) => Promise<void>
}

export default function Verlauf({ etappen, onChange }: Props) {
  const sortiert = [...etappen].reverse()

  async function handleDelete(id: string) {
    if (!confirm('Diese Etappe wirklich löschen?')) return
    await onChange(etappen.filter((e) => e.id !== id))
  }

  async function handleUpdate(id: string, patch: Partial<Etappe>) {
    await onChange(etappen.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  return (
    <div className="form">
      <h2>Verlauf</h2>
      {sortiert.length === 0 && <p className="hinweis">Noch keine Fahrten erfasst.</p>}
      <ul className="verlauf-liste">
        {sortiert.map((e) => (
          <li key={e.id} className={e.exportiert ? 'exportiert' : ''}>
            <div className="verlauf-kopf">
              <span>
                {e.datum} · {e.fahrzeug}
              </span>
              <button type="button" onClick={() => handleDelete(e.id)}>
                Löschen
              </button>
            </div>
            <div className="verlauf-felder">
              <label>
                Start
                <input value={e.start} onChange={(ev) => handleUpdate(e.id, { start: ev.target.value })} />
              </label>
              <label>
                Ziel
                <input value={e.ziel} onChange={(ev) => handleUpdate(e.id, { ziel: ev.target.value })} />
              </label>
              <label>
                Zweck
                <input value={e.zweck} onChange={(ev) => handleUpdate(e.id, { zweck: ev.target.value })} />
              </label>
              <label>
                Abfahrt
                <input
                  type="time"
                  value={e.abfahrt}
                  onChange={(ev) => handleUpdate(e.id, { abfahrt: ev.target.value })}
                />
              </label>
              <label>
                Ankunft
                <input
                  type="time"
                  value={e.ankunft}
                  onChange={(ev) => handleUpdate(e.id, { ankunft: ev.target.value })}
                />
              </label>
              <label>
                Strecke (km)
                <input
                  type="number"
                  value={e.strecke}
                  onChange={(ev) => handleUpdate(e.id, { strecke: Number(ev.target.value) })}
                />
              </label>
            </div>
            {e.exportiert && <span className="badge">exportiert</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
