'use client'

import { useState } from 'react'
import { COPING_CARDS } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = ['All', 'DBT', 'Somatic', 'Mindfulness', 'Regulation', 'Interpersonal', 'Sleep']

export default function CopingPage() {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [active, setActive] = useState<typeof COPING_CARDS[0] | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filtered = COPING_CARDS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = cat === 'All' || c.category === cat
    return matchSearch && matchCat
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Coping <em>Toolkit</em></h1>
        <p className="text-muted text-sm">Quick tools for right now, when you need them most</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tools..." className="input pl-9" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={cn('text-xs px-3 py-1.5 rounded-full border transition-all', cat === c ? 'bg-sage-400 text-white border-sage-400' : 'bg-white text-muted border-sage-100 hover:border-sage-300')}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => setActive(card)}
            className="card p-5 cursor-pointer hover:shadow-card-hover hover:border-sage-200 transition-all group relative"
          >
            <button onClick={e => toggleFav(card.id, e)}
              className={cn('absolute top-3 right-3 p-1 rounded-lg transition-colors', favorites.has(card.id) ? 'text-yellow-500' : 'text-gray-200 hover:text-yellow-400')}>
              <Star className={cn('w-4 h-4', favorites.has(card.id) && 'fill-current')} />
            </button>
            <div className="text-2xl mb-2">{card.emoji}</div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-charcoal group-hover:text-sage-700 transition-colors">{card.name}</h3>
            </div>
            <span className="badge bg-sage-50 text-sage-700 border border-sage-100 text-xs mb-2">{card.category}</span>
            <p className="text-sm text-muted leading-relaxed">{card.description}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50" onClick={() => setActive(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 max-w-sm mx-auto p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-3xl mb-2">{active.emoji}</div>
                  <h2 className="font-serif text-xl text-charcoal">{active.name}</h2>
                  <span className="badge bg-sage-50 text-sage-700 border border-sage-100 text-xs mt-1">{active.category}</span>
                </div>
                <button onClick={() => setActive(null)} className="p-1.5 hover:bg-sage-50 rounded-lg">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>
              <p className="text-sm text-muted mb-4 leading-relaxed">{active.description}</p>
              <ol className="space-y-2.5">
                {active.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-charcoal">
                    <span className="w-5 h-5 bg-sage-100 text-sage-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
