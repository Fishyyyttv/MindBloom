'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bug, Lightbulb, Send } from 'lucide-react'
import { toast } from 'sonner'

type FeedbackMode = 'bug' | 'feature'
type Severity = 'low' | 'medium' | 'high' | 'critical'
type FeatureImpact = 'nice_to_have' | 'helpful' | 'high_impact' | 'game_changer'
type FeatureCategory = 'ai' | 'wellness_tools' | 'journal' | 'mood' | 'design' | 'integrations' | 'other'

const SEVERITY_OPTIONS: Array<{ value: Severity; label: string; hint: string }> = [
  { value: 'low', label: 'Low', hint: 'Minor issue, workaround exists' },
  { value: 'medium', label: 'Medium', hint: 'Affects usage but not blocking' },
  { value: 'high', label: 'High', hint: 'Major feature is broken' },
  { value: 'critical', label: 'Critical', hint: 'App is unusable or data loss risk' },
]

const IMPACT_OPTIONS: Array<{ value: FeatureImpact; label: string; hint: string }> = [
  { value: 'nice_to_have', label: 'Nice to have', hint: 'Small quality-of-life improvement' },
  { value: 'helpful', label: 'Helpful', hint: 'Would improve regular use' },
  { value: 'high_impact', label: 'High impact', hint: 'Would significantly improve outcomes' },
  { value: 'game_changer', label: 'Game changer', hint: 'Could make Bloom uniquely valuable' },
]

const CATEGORY_OPTIONS: Array<{ value: FeatureCategory; label: string }> = [
  { value: 'ai', label: 'AI Companion' },
  { value: 'wellness_tools', label: 'Wellness Tools' },
  { value: 'journal', label: 'Journal/Diary' },
  { value: 'mood', label: 'Mood Tracking' },
  { value: 'design', label: 'UI/Design' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'other', label: 'Other' },
]

export default function ReportBugPage() {
  const [mode, setMode] = useState<FeedbackMode>('bug')
  const [title, setTitle] = useState('')
  const [whatHappened, setWhatHappened] = useState('')
  const [expectedBehavior, setExpectedBehavior] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [featureIdea, setFeatureIdea] = useState('')
  const [featureValue, setFeatureValue] = useState('')
  const [featureUniqueness, setFeatureUniqueness] = useState('')
  const [severity, setSeverity] = useState<Severity>('medium')
  const [featureImpact, setFeatureImpact] = useState<FeatureImpact>('helpful')
  const [featureCategory, setFeatureCategory] = useState<FeatureCategory>('ai')
  const [pageUrl, setPageUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPageUrl(window.location.href)
  }, [])

  const selectedSeverity = useMemo(
    () => SEVERITY_OPTIONS.find((option) => option.value === severity),
    [severity]
  )

  const selectedImpact = useMemo(
    () => IMPACT_OPTIONS.find((option) => option.value === featureImpact),
    [featureImpact]
  )

  const canSubmit =
    mode === 'bug'
      ? title.trim().length > 0 && whatHappened.trim().length > 0 && !loading
      : title.trim().length > 0 && featureIdea.trim().length > 0 && featureValue.trim().length > 0 && !loading

  const resetForm = () => {
    setTitle('')
    setWhatHappened('')
    setExpectedBehavior('')
    setStepsToReproduce('')
    setFeatureIdea('')
    setFeatureValue('')
    setFeatureUniqueness('')
    setSeverity('medium')
    setFeatureImpact('helpful')
    setFeatureCategory('ai')
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setLoading(true)
    try {
      const isBug = mode === 'bug'
      const endpoint = isBug ? '/api/bug-reports' : '/api/feature-requests'

      const bugDescription = [
        `What happened:\n${whatHappened.trim()}`,
        expectedBehavior.trim() ? `Expected behavior:\n${expectedBehavior.trim()}` : '',
        stepsToReproduce.trim() ? `Steps to reproduce:\n${stepsToReproduce.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      const featureDescription = [
        `Feature idea:\n${featureIdea.trim()}`,
        `Why this helps:\n${featureValue.trim()}`,
        featureUniqueness.trim() ? `How this makes Bloom stand out:\n${featureUniqueness.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')

      const payload = isBug
        ? {
            title: title.trim(),
            description: bugDescription,
            severity,
            pageUrl: pageUrl.trim() || null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          }
        : {
            title: title.trim(),
            description: featureDescription,
            impact: featureImpact,
            category: featureCategory,
            pageUrl: pageUrl.trim() || null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseBody = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(responseBody?.error || 'Failed to submit')
      }

      toast.success(isBug ? 'Bug report submitted. Thank you.' : 'Feature request submitted. Thank you.')
      resetForm()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Product Feedback</h1>
        <p className="text-muted text-sm">Report a bug or request a feature. Both go straight to your admin panel.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div className="inline-flex rounded-xl border border-sage-200 bg-sage-50 p-1">
          <button
            type="button"
            onClick={() => setMode('bug')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${mode === 'bug' ? 'bg-white text-charcoal shadow-sm' : 'text-muted hover:text-charcoal'}`}
          >
            Report bug
          </button>
          <button
            type="button"
            onClick={() => setMode('feature')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${mode === 'feature' ? 'bg-white text-charcoal shadow-sm' : 'text-muted hover:text-charcoal'}`}
          >
            Request feature
          </button>
        </div>

        <div>
          <label className="label">Short title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
            className="input"
            placeholder={mode === 'bug' ? 'Example: Mood save button spins forever' : 'Example: AI remembers long-term coping preferences'}
          />
        </div>

        {mode === 'bug' ? (
          <>
            <div>
              <label className="label">What happened?</label>
              <textarea
                value={whatHappened}
                onChange={(event) => setWhatHappened(event.target.value)}
                rows={4}
                className="textarea"
                placeholder="Describe the bug clearly."
              />
            </div>

            <div>
              <label className="label">What should have happened? <span className="text-muted font-normal">(optional)</span></label>
              <textarea
                value={expectedBehavior}
                onChange={(event) => setExpectedBehavior(event.target.value)}
                rows={3}
                className="textarea"
                placeholder="Describe the expected behavior."
              />
            </div>

            <div>
              <label className="label">Steps to reproduce <span className="text-muted font-normal">(optional)</span></label>
              <textarea
                value={stepsToReproduce}
                onChange={(event) => setStepsToReproduce(event.target.value)}
                rows={3}
                className="textarea"
                placeholder={'1. Go to...\n2. Click...\n3. See error...'}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Severity</label>
                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as Severity)}
                  className="input"
                >
                  {SEVERITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">{selectedSeverity?.hint}</p>
              </div>

              <div>
                <label className="label">Page URL <span className="text-muted font-normal">(optional)</span></label>
                <input
                  value={pageUrl}
                  onChange={(event) => setPageUrl(event.target.value)}
                  className="input"
                  placeholder="https://..."
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label">What should we build?</label>
              <textarea
                value={featureIdea}
                onChange={(event) => setFeatureIdea(event.target.value)}
                rows={4}
                className="textarea"
                placeholder="Describe the feature request."
              />
            </div>

            <div>
              <label className="label">Why would this help users?</label>
              <textarea
                value={featureValue}
                onChange={(event) => setFeatureValue(event.target.value)}
                rows={3}
                className="textarea"
                placeholder="What problem does this solve?"
              />
            </div>

            <div>
              <label className="label">How does this make Bloom stand out? <span className="text-muted font-normal">(optional)</span></label>
              <textarea
                value={featureUniqueness}
                onChange={(event) => setFeatureUniqueness(event.target.value)}
                rows={3}
                className="textarea"
                placeholder="What makes this unique compared to other apps?"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Impact</label>
                <select
                  value={featureImpact}
                  onChange={(event) => setFeatureImpact(event.target.value as FeatureImpact)}
                  className="input"
                >
                  {IMPACT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-1">{selectedImpact?.hint}</p>
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={featureCategory}
                  onChange={(event) => setFeatureCategory(event.target.value as FeatureCategory)}
                  className="input"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          Avoid sharing passwords, card numbers, or highly sensitive personal info.
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            mode === 'bug' ? <Bug className="w-4 h-4 animate-pulse" /> : <Lightbulb className="w-4 h-4 animate-pulse" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {loading ? 'Submitting...' : mode === 'bug' ? 'Submit bug report' : 'Submit feature request'}
        </button>
      </div>
    </div>
  )
}
