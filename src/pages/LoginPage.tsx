import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, inputClass } from '@/components/ui/Field'
import { useAuth } from '@/features/auth/useAuth'

type Mode = 'signin' | 'signup'

/** Minimo que o Supabase Auth aceita por padrao. */
const MIN_PASSWORD = 6

export default function LoginPage() {
  const { user, isMock, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (user) return <Navigate to={from} replace />

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email, password)

        if (needsConfirmation) {
          // Conta criada, mas sem sessao: navegar aqui so cairia de volta no login.
          setNotice(`Conta criada. Confirme o e-mail enviado para ${email} e depois entre.`)
          setMode('signin')
          setPassword('')
          return
        }
      } else {
        await signIn(email, password)
      }

      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel continuar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <img src="/pet.svg" alt="" className="size-7" />
          <span className="text-lg font-semibold">Pet Care</span>
        </div>

        <h1 className="mb-4 text-sm font-medium text-slate-600">
          {mode === 'signin' ? 'Entre na sua conta' : 'Crie sua conta'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="E-mail">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Senha"
            hint={mode === 'signup' ? `Minimo de ${MIN_PASSWORD} caracteres` : undefined}
          >
            <input
              type="password"
              required
              minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notice && <p className="text-sm text-teal-700">{notice}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting
              ? mode === 'signin'
                ? 'Entrando...'
                : 'Criando...'
              : mode === 'signin'
                ? 'Entrar'
                : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-500">
          {mode === 'signin' ? 'Ainda nao tem conta?' : 'Ja tem conta?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="font-medium text-teal-700 hover:text-teal-800"
          >
            {mode === 'signin' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>

        {isMock && (
          <p className="mt-4 text-xs text-slate-500">
            Supabase nao configurado: qualquer e-mail/senha cria uma sessao local de teste.
          </p>
        )}
      </Card>
    </div>
  )
}
