import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from './apiConfig'

const AuthPage = ({ onAuthSuccess }) => {
  const navigate = useNavigate()
  const [register, setRegister] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function postForm(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = register
      ? { name, email, password }
      : { email, password }

    try {
      const response = await fetch(`${API_URL}/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Unable to sign in. Please try again.')
      }

      const user = data.user ?? {
        name: register ? name : data.name ?? '',
        email,
      }

      onAuthSuccess?.(user)
      navigate('/home', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to connect. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleMode() {
    setRegister((value) => !value)
    setError('')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 h-120 w-120 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/30 md:min-h-152.5 md:grid-cols-[1fr_1.05fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-indigo-700 via-indigo-600 to-blue-500 p-10 text-white md:flex lg:p-12">
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/15" />
          <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-white/15" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-white/5" />

          <div className="relative flex w-fit items-center gap-3 font-semibold tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M5 18.5 3.5 21l4-.9A9 9 0 1 0 3 12c0 2.5.8 4.7 2 6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-xl">Chatify</span>
          </div>

          <div className="relative max-w-md py-12">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
              A little closer, wherever you are
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
              Good conversations start here.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-blue-100">
              Catch up, share a thought, and stay connected with the people who matter.
            </p>
          </div>

          <p className="relative text-sm text-blue-100/80">Simple, personal conversations.</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 md:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 md:hidden">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                  <path d="M5 18.5 3.5 21l4-.9A9 9 0 1 0 3 12c0 2.5.8 4.7 2 6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-indigo-600">CHATIFY</p>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-indigo-600">
                {register ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                {register ? 'Join the conversation' : 'Sign in to Chatify'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {register
                  ? 'Create an account to start connecting with people.'
                  : 'Enter your details and pick up where you left off.'}
              </p>
            </div>

            <form onSubmit={postForm} className="space-y-5">
              {register && (
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                    Your name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={80}
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={register ? 8 : undefined}
                  placeholder={register ? 'At least 8 characters' : 'Enter your password'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/25 disabled:cursor-wait disabled:opacity-70"
              >
                {submitting ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
                {!submitting && (
                  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M4.167 10h11.666m0 0L10 4.167M15.833 10 10 15.833" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              {register ? 'Already have an account?' : 'New to Chatify?'}
              {' '}
              <button
                type="button"
                onClick={toggleMode}
                className="font-semibold text-indigo-600 hover:text-indigo-700 focus:outline-none focus:underline"
              >
                {register ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AuthPage
