import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { PawPrint, Menu, X, Bell, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/store"

const ownerLinks = [
  { label: "首页", to: "/" },
  { label: "预约寄养", to: "/booking" },
  { label: "我的预约", to: "/my-bookings" },
]

const caretakerLinks = [{ label: "工作台", to: "/staff" }]

const adminLinks = [
  { label: "管理面板", to: "/admin" },
  { label: "报表查询", to: "/admin/reports" },
]

const publicLinks = [
  { label: "首页", to: "/" },
  { label: "登录", to: "/login" },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const logout = useStore((s) => s.logout)
  const notifications = useStore((s) => s.notifications)
  const removeNotification = useStore((s) => s.removeNotification)

  const links = currentUser
    ? currentUser.role === "owner"
      ? ownerLinks
      : currentUser.role === "caretaker"
        ? caretakerLinks
        : adminLinks
    : publicLinks

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-coral-400 text-lg shrink-0">
            <PawPrint className="w-6 h-6" />
            <span>毛孩寄养</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-semibold text-gray-600 hover:text-coral-400 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((v) => !v)}
                  className="relative p-1 text-gray-500 hover:text-coral-400 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-coral-400 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {bellOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-card-hover border border-cream-200 overflow-hidden"
                    >
                      <div className="px-4 py-2 text-xs font-bold text-gray-500 border-b border-cream-200">
                        通知
                      </div>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">暂无通知</div>
                      ) : (
                        <ul className="max-h-64 overflow-y-auto">
                          {notifications.map((n) => (
                            <li
                              key={n.id}
                              className="flex items-start justify-between gap-2 px-4 py-2.5 hover:bg-cream-50 transition-colors"
                            >
                              <span className="text-sm text-gray-700">{n.message}</span>
                              <button
                                onClick={() => removeNotification(n.id)}
                                className="shrink-0 text-gray-300 hover:text-coral-400 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {currentUser && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">{currentUser.name}</span>
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-400 hover:text-coral-400 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              className="md:hidden p-1 text-gray-500 hover:text-coral-400 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-cream-200"
            >
              <div className="px-4 py-3 space-y-2">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm font-semibold text-gray-600 hover:text-coral-400 transition-colors py-1.5"
                  >
                    {l.label}
                  </Link>
                ))}
                {currentUser && (
                  <div className="flex items-center justify-between pt-2 border-t border-cream-200">
                    <span className="text-sm font-semibold text-gray-700">{currentUser.name}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-coral-400 font-semibold"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>{children}</main>
    </div>
  )
}
