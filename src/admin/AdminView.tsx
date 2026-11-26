import { useState, useEffect } from "react"
import { checkAdminAuth } from "../services/api"
import AdminLogin from "./AdminLogin"
import AdminDashboard from "./AdminDashboard"

interface AdminViewProps {
  onBackToSite: () => void
}

export default function AdminView({ onBackToSite }: AdminViewProps) {
  const [adminUsername, setAdminUsername] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    let mounted = true
    async function verify() {
      try {
        const user = await checkAdminAuth()
        if (mounted) {
          setAdminUsername(user?.username || null)
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false)
        }
      }
    }
    verify()
    return () => {
      mounted = false
    }
  }, [])

  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#fdffe2] text-[#007b5f]">
        <div className="flex flex-col items-center gap-3">
         
          <span className="text-sm font-semibold tracking-wider uppercase">Loading Admin Portal...</span>
        </div>
      </div>
    )
  }

  if (adminUsername) {
    return (
      <AdminDashboard
        adminUsername={adminUsername}
        onLogout={() => setAdminUsername(null)}
        onBackToSite={onBackToSite}
      />
    )
  }

  return (
    <AdminLogin
      onLoginSuccess={(username) => setAdminUsername(username)}
      onBackToSite={onBackToSite}
    />
  )
}

