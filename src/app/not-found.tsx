import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
      <div>
        <div className="text-6xl mb-4">🌱</div>
        <h1 className="font-serif text-4xl text-charcoal mb-3">Page not found</h1>
        <p className="text-muted mb-8">This page doesn't exist — but we've got you covered.</p>
        <Link href="/" className="btn-primary">Go home</Link>
      </div>
    </div>
  )
}
