import { Navigate } from "react-router-dom"
import { useStore } from "@/store"
import type { UserRole } from "@/types"

interface Props {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireAuth?: boolean
}

export default function ProtectedRoute({ children, allowedRoles, requireAuth = true }: Props) {
  const currentUser = useStore((s) => s.currentUser)

  if (requireAuth && !currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser && allowedRoles && !allowedRoles.includes(currentUser.role)) {
    const redirectMap: Record<UserRole, string> = {
      owner: "/",
      caretaker: "/staff",
      admin: "/admin",
    }
    return <Navigate to={redirectMap[currentUser.role]} replace />
  }

  return <>{children}</>
}
