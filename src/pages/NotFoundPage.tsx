import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <h1 className="text-4xl font-semibold text-slate-900">404</h1>
      <p className="text-slate-600">Pagina nao encontrada.</p>
      <Link to="/" className="text-sm font-medium text-teal-700">
        Voltar ao inicio
      </Link>
    </div>
  )
}
