import { useState } from 'react'
import type { Route } from '../types'

interface Props {
  routen: Route[]
  onChange: (routen: Route[]) => Promise<void>
}

function newRouteId(): string {
  return `r-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export default function Zielverwaltung({ routen, onChange }: Props) {
  const [name, setName] = useState('')
  const [ort, setOrt] = useState('')
  const [strasse, setStrasse] = useState('')
  const [refKm, setRefKm] = useState('')
  const [refDauerMin, setRefDauerMin] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !ort.trim() || !refKm || !refDauerMin) return

    const neue: Route = {
      id: newRouteId(),
      name: name.trim(),
      ort: ort.trim(),
      strasse: strasse.trim(),
      refKm: Number(refKm),
      refDauerMin: Number(refDauerMin),
    }
    await onChange([...routen, neue])
    setName('')
    setOrt('')
    setStrasse('')
    setRefKm('')
    setRefDauerMin('')
  }

  async function handleDelete(id: string) {
    await onChange(routen.filter((r) => r.id !== id))
  }

  async function handleUpdate(id: string, patch: Partial<Route>) {
    await onChange(routen.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <div className="form">
      <h2>Häufige Ziele</h2>

      <table className="tabelle">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ort</th>
            <th>Straße</th>
            <th>km</th>
            <th>Min</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {routen.map((r) => (
            <tr key={r.id}>
              <td>
                <input value={r.name} onChange={(e) => handleUpdate(r.id, { name: e.target.value })} />
              </td>
              <td>
                <input value={r.ort} onChange={(e) => handleUpdate(r.id, { ort: e.target.value })} />
              </td>
              <td>
                <input value={r.strasse} onChange={(e) => handleUpdate(r.id, { strasse: e.target.value })} />
              </td>
              <td>
                <input
                  type="number"
                  value={r.refKm}
                  onChange={(e) => handleUpdate(r.id, { refKm: Number(e.target.value) })}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={r.refDauerMin}
                  onChange={(e) => handleUpdate(r.id, { refDauerMin: Number(e.target.value) })}
                />
              </td>
              <td>
                <button type="button" onClick={() => handleDelete(r.id)}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Neues Ziel</h3>
      <form onSubmit={handleAdd}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Pfarramt Homberg" />
        </label>
        <label>
          Ort
          <input value={ort} onChange={(e) => setOrt(e.target.value)} />
        </label>
        <label>
          Straße
          <input value={strasse} onChange={(e) => setStrasse(e.target.value)} />
        </label>
        <label>
          Referenz-km (einfache Strecke)
          <input type="number" inputMode="numeric" value={refKm} onChange={(e) => setRefKm(e.target.value)} />
        </label>
        <label>
          Referenz-Fahrzeit (Minuten, einfache Strecke)
          <input
            type="number"
            inputMode="numeric"
            value={refDauerMin}
            onChange={(e) => setRefDauerMin(e.target.value)}
          />
        </label>
        <button type="submit" className="primary">
          Ziel speichern
        </button>
      </form>
    </div>
  )
}
