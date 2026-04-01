'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-cream flex items-center justify-center px-6 text-center font-sans">
        <div>
          <div className="text-6xl mb-4">💙</div>
          <h1 className="font-serif text-3xl text-charcoal mb-3">Something went wrong</h1>
          <p className="text-muted mb-8 max-w-sm mx-auto">We hit an unexpected error. Your data is safe — try refreshing.</p>
          <button onClick={reset} className="btn-primary">Try again</button>
        </div>
      </body>
    </html>
  )
}
