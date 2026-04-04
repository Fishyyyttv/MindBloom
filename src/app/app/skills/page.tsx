'use client'

import { useEffect, useState } from 'react'
import { DBT_SKILLS } from '@/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2 } from 'lucide-react'

export default function SkillsPage() {
  const [activeSkill, setActiveSkill] = useState<{ name: string; description: string; steps: string[] } | null>(null)
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)
  const [sessionLogged, setSessionLogged] = useState(false)

  const openSkill = (skill: { name: string; description: string; steps: string[] }) => {
    setActiveSkill(skill)
    setCheckedSteps(new Set())
    setSessionStartedAt(Date.now())
    setSessionLogged(false)
  }

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  useEffect(() => {
    if (!activeSkill || sessionLogged) return
    if (checkedSteps.size !== activeSkill.steps.length) return

    const durationSeconds = sessionStartedAt
      ? Math.max(0, Math.round((Date.now() - sessionStartedAt) / 1000))
      : null

    const logSession = async () => {
      try {
        const res = await fetch('/api/skills/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skillType: activeSkill.name,
            durationSeconds,
          }),
        })

        if (res.ok) {
          setSessionLogged(true)
        }
      } catch {
        // Session tracking should never block the user flow.
      }
    }

    logSession()
  }, [activeSkill, checkedSteps, sessionLogged, sessionStartedAt])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">DBT & CBT <em>Skills</em></h1>
        <p className="text-muted text-sm">Evidence-based techniques to manage emotions and improve relationships</p>
      </div>

      {DBT_SKILLS.map((category, categoryIndex) => (
        <div key={category.category}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-sage-100" />
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider px-3">{category.category}</h2>
            <div className="h-px flex-1 bg-sage-100" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {category.skills.map((skill, skillIndex) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (categoryIndex * 4 + skillIndex) * 0.06 }}
                className={cn('card p-5 cursor-pointer hover:shadow-card-hover transition-all border-l-4', category.color)}
                style={{ borderLeftColor: category.accent }}
                onClick={() => openSkill(skill)}
              >
                <h3 className="font-semibold text-charcoal mb-1 text-lg font-serif">{skill.name}</h3>
                <p className="text-sm text-muted leading-relaxed">{skill.description}</p>
                <div className="mt-3 text-xs font-medium flex items-center gap-1" style={{ color: category.accent }}>
                  {skill.steps.length} steps - tap to open
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {activeSkill && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setActiveSkill(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 max-w-md mx-auto p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-2xl text-charcoal">{activeSkill.name}</h2>
                  <p className="text-sm text-muted mt-1">{activeSkill.description}</p>
                </div>
                <button onClick={() => setActiveSkill(null)} className="p-1 hover:bg-sage-50 rounded-lg ml-4">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="space-y-3">
                {activeSkill.steps.map((step, index) => (
                  <button
                    key={`${activeSkill.name}-${index}`}
                    onClick={() => toggleStep(index)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all',
                      checkedSteps.has(index)
                        ? 'bg-sage-50 border border-sage-200'
                        : 'bg-gray-50 border border-transparent hover:border-sage-100'
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0 transition-colors',
                        checkedSteps.has(index) ? 'text-sage-500' : 'text-gray-300'
                      )}
                    />
                    <span className={cn('text-sm leading-relaxed', checkedSteps.has(index) ? 'text-sage-700' : 'text-charcoal')}>
                      {step}
                    </span>
                  </button>
                ))}
              </div>

              {checkedSteps.size === activeSkill.steps.length && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 bg-sage-50 border border-sage-200 rounded-xl p-4 text-center"
                >
                  <div className="text-2xl mb-1">🌱</div>
                  <p className="text-sm text-sage-700 font-medium">Skill complete - great work.</p>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
