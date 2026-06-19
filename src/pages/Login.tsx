import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { User, Shield, Crown, PawPrint, Phone, Lock, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useStore } from "@/store"
import type { UserRole } from "@/types"

const roles: { key: UserRole; label: string; icon: typeof User; color: string }[] = [
  { key: "owner", label: "宠物主人", icon: User, color: "bg-coral-400" },
  { key: "caretaker", label: "养护员", icon: Shield, color: "bg-mint-400" },
  { key: "admin", label: "管理员", icon: Crown, color: "bg-amber-500" },
]

export default function Login() {
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const register = useStore((s) => s.register)
  const [selectedRole, setSelectedRole] = useState<UserRole>("owner")
  const [isRegister, setIsRegister] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")

  const [regName, setRegName] = useState("")
  const [regPhone, setRegPhone] = useState("")
  const [regPassword, setRegPassword] = useState("")

  function handleLogin() {
    setError("")
    if (selectedRole === "admin") {
      const user = login(phone, password)
      if (user && user.role === "admin") {
        navigate("/admin")
      } else {
        setError("管理员账号或密码错误")
      }
    } else {
      const user = login(phone, password)
      if (user && (user.role === "owner" || user.role === "caretaker")) {
        navigate(user.role === "owner" ? "/" : "/staff")
      } else {
        setError("手机号或密码错误")
      }
    }
  }

  function handleRegister() {
    setError("")
    if (!regName || !regPhone || !regPassword) {
      setError("请填写完整信息")
      return
    }
    const user = register({
      name: regName,
      phone: regPhone,
      password: regPassword,
      role: selectedRole,
    })
    login(user.phone, user.password!)
    navigate(selectedRole === "owner" ? "/" : "/staff")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isRegister && selectedRole !== "admin") {
      handleRegister()
    } else {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-400 via-coral-300 to-mint-400 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-4xl shadow-card-hover p-8"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <PawPrint className="w-8 h-8 text-coral-400" />
          <h1 className="text-2xl font-display font-extrabold text-gray-800">毛孩寄养</h1>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {roles.map((r) => {
            const Icon = r.icon
            const active = selectedRole === r.key
            return (
              <motion.button
                key={r.key}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSelectedRole(r.key)
                  setIsRegister(false)
                  setError("")
                }}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors ${
                  active
                    ? `${r.color} text-white shadow-card`
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold">{r.label}</span>
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={`${selectedRole}-${isRegister}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {selectedRole === "admin" ? (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="管理员账号"
                    value={username}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/70 border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm transition"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/70 border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            ) : isRegister ? (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="姓名"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/70 border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm transition"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="手机号"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/70 border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm transition"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="密码"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/70 border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/70 border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm transition"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/70 border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-coral-500 text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-coral-400 text-white font-bold text-sm hover:bg-coral-500 transition-colors shadow-glow"
            >
              {isRegister && selectedRole !== "admin" ? "注册" : "登录"}
            </button>
          </motion.form>
        </AnimatePresence>

        {selectedRole !== "admin" && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {isRegister ? (
              <>
                已有账号？
                <button
                  onClick={() => {
                    setIsRegister(false)
                    setError("")
                  }}
                  className="text-coral-400 font-semibold ml-1"
                >
                  去登录
                </button>
              </>
            ) : (
              <>
                没有账号？
                <button
                  onClick={() => {
                    setIsRegister(true)
                    setError("")
                  }}
                  className="text-coral-400 font-semibold ml-1"
                >
                  注册
                </button>
              </>
            )}
          </p>
        )}

        <div className="mt-6 p-4 rounded-2xl bg-cream-100/60 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 mb-2">演示账号</p>
          <p className="text-xs text-gray-400">宠物主人：13800138001 / 123456</p>
          <p className="text-xs text-gray-400">养护员：13800138004 / 123456</p>
          <p className="text-xs text-gray-400">管理员：13800138006 / admin123</p>
        </div>
      </motion.div>
    </div>
  )
}
