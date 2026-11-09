import React, { useState } from "react"
import { loginAdmin } from "../services/api"

interface AdminLoginProps {
  onLoginSuccess: (username: string) => void
  onBackToSite: () => void
}

export default function AdminLogin({ onLoginSuccess, onBackToSite }: AdminLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setErrorMessage("Please enter both username and password.")
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const result = await loginAdmin(username.trim(), password)
      onLoginSuccess(result.username)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please verify credentials."
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-[#fdffe2] text-[#343434] overflow-x-clip">
      {/* Return to website link */}
      <div className="w-full max-w-md mb-4 sm:mb-6 flex flex-wrap justify-between items-center gap-x-4 gap-y-1">
        <button
          onClick={onBackToSite}
          type="button"
          className="min-h-11 text-sm font-semibold text-[#007b5f] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>&larr;</span> Back to Public Website
        </button>
        <span className="text-xs uppercase tracking-widest text-[#007b5f]/70 font-bold">Admin Portal</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-[#007b5f]/15">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block mb-3 px-3 py-1 rounded-full bg-[#007b5f]/10 text-[#007b5f] text-xs font-semibold tracking-wider uppercase">
            Jeya Greens &amp; Co.
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#007b5f]">Admin Login</h1>
          <p className="text-sm text-[#343434]/70 mt-1">Sign in to manage products and gallery images</p>
        </div>

        {errorMessage && (
          <div
            className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2"
            role="alert"
          >
            <span className="font-bold text-red-800">&times;</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#343434]/80 mb-2" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#007b5f] focus:ring-2 focus:ring-[#007b5f]/20 transition-all text-base text-[#343434]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#343434]/80 mb-2" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#007b5f] focus:ring-2 focus:ring-[#007b5f]/20 transition-all text-base text-[#343434]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-6 rounded-xl bg-[#007b5f] text-[#fdffe2] font-semibold text-base shadow-md hover:bg-[#00634c] focus:outline-none focus:ring-2 focus:ring-[#007b5f]/40 transition-all cursor-pointer flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[#fdffe2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>

      <div className="mt-6 sm:mt-8 max-w-md px-2 text-xs text-center text-[#343434]/50">
        &copy; {new Date().getFullYear()} Jeya Greens &amp; Co. Secured single administrator access.
      </div>
    </div>
  )
}

