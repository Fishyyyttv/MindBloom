'use client'

import { useState } from 'react'
import { GROUNDING_TECHNIQUES } from '@/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, RotateCcw, CheckCircle2 } from 'lucide-react'

export default function GroundingPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [done, setDone] = useState(false)

  const technique = GROUNDING_TECHNIQUES.find(t => t.id === selected)

  const reset = () => { setStepIdx(0); setInputs({}); setDone(false) }
  const back = () => { setSelected(null); reset() }

  const next = () => {
    if (!technique) return
    if (stepIdx < technique.steps.length - 1) {
      setStepIdx(s => s + 1)
    } else {
      setDone(true)
    }
  }

  if (selected && technique) {
    const step = technique.steps[stepIdx]
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={back} className="btn-ghost text-sm">← Back</button>
          <div>
            <h1 className="font-serif text-2xl text-charcoal">{technique.name}</h1>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {technique.steps.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all', i <= stepIdx ? 'bg-sage-400' : 'bg-sage-100')} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="card p-10 text-center space-y-4">
              <div className="text-5xl">🌿</div>
              <h2 className="font-serif text-2xl text-charcoal">You did it.</h2>
              <p className="text-muted leading-relaxed">Take a moment to notice how your body feels right now compared to when you started. You just gave your nervous system a reset.</p>
              <button onClick={reset} className="btn-primary flex items-center gap-2 mx-auto">
                <RotateCcw className="w-4 h-4" /> Go again
              </button>
            </motion.div>
          ) : (
            <motion.div key={stepIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="card p-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{step.icon}</div>
                <div>
                  <div className="text-xs text-muted uppercase tracking-wide">Step {stepIdx + 1}</div>
                  <h2 className="font-serif text-xl text-charcoal">{step.sense}</h2>
                </div>
              </div>
              <p className="text-muted leading-relaxed">{step.prompt}</p>

              {(step.count ?? 0) > 0 && (
                <div className="space-y-2">
                  {Array.from({ length: step.count }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`${i + 1}.`}
                      value={inputs[stepIdx * 10 + i] ?? ''}
                      onChange={e => setInputs(prev => ({ ...prev, [stepIdx * 10 + i]: e.target.value }))}
                      className="input"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              )}

              <button onClick={next} className="btn-primary flex items-center gap-2 w-full justify-center">
                {stepIdx < technique.steps.length - 1 ? (
                  <><ChevronRight className="w-4 h-4" /> Next</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Finish</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Grounding <em>Techniques</em></h1>
        <p className="text-muted text-sm">Bring yourself back to right now, one step at a time</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {GROUNDING_TECHNIQUES.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => { setSelected(t.id); reset() }}
            className="card p-6 text-left hover:shadow-card-hover hover:border-sage-200 transition-all group"
          >
            <div className="text-3xl mb-3">{t.emoji}</div>
            <h2 className="font-semibold text-charcoal mb-1 group-hover:text-sage-700 transition-colors">{t.name}</h2>
            <p className="text-sm text-muted leading-relaxed mb-4">{t.description}</p>
            <div className="flex items-center gap-1 text-sage-600 text-sm font-medium">
              Begin <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
