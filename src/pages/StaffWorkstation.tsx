import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ClipboardCheck, PawPrint, AlertTriangle, QrCode, BookOpen, AlertCircle, LogOut } from "lucide-react"
import { format, isToday, parseISO } from "date-fns"
import { useStore } from "@/store"
import StatusBadge from "@/components/StatusBadge"
import Empty from "@/components/Empty"

export default function StaffWorkstation() {
  const navigate = useNavigate()
  const bookings = useStore((s) => s.bookings)
  const pets = useStore((s) => s.pets)
  const users = useStore((s) => s.users)
  const cages = useStore((s) => s.cages)
  const incidents = useStore((s) => s.incidents)

  const todayCheckins = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" && isToday(parseISO(b.startDate))),
    [bookings]
  )

  const inResidence = useMemo(
    () => bookings.filter((b) => b.status === "checked_in"),
    [bookings]
  )

  const todayIncidents = useMemo(
    () => incidents.filter((i) => isToday(parseISO(i.createdAt))),
    [incidents]
  )

  const getPet = (petId: string) => pets.find((p) => p.id === petId)
  const getOwner = (ownerId: string) => users.find((u) => u.id === ownerId)
  const getCage = (cageId: string) => cages.find((c) => c.id === cageId)

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      <div className="bg-gradient-to-r from-coral-400 to-coral-500 px-6 py-8 text-white">
        <h1 className="text-2xl font-display font-extrabold">养护员工作站</h1>
        <p className="text-white/70 text-sm mt-1">{format(new Date(), "yyyy年MM月dd日")}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-4 text-center"
          >
            <ClipboardCheck className="w-6 h-6 text-coral-400 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-800">{todayCheckins.length}</p>
            <p className="text-xs text-gray-500">今日待核销</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-card p-4 text-center"
          >
            <PawPrint className="w-6 h-6 text-mint-400 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-800">{inResidence.length}</p>
            <p className="text-xs text-gray-500">在住宠物</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-card p-4 text-center"
          >
            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-800">{todayIncidents.length}</p>
            <p className="text-xs text-gray-500">今日异常</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-3">今日待核销</h2>
        {todayCheckins.length === 0 ? (
          <Empty message="今日无待核销预约" />
        ) : (
          <div className="space-y-3">
            {todayCheckins.map((booking, idx) => {
              const pet = getPet(booking.petId)
              const owner = getOwner(booking.ownerId)
              const cage = getCage(booking.cageId)
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-coral-400/10 flex items-center justify-center">
                        <PawPrint className="w-6 h-6 text-coral-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{pet?.name ?? "未知"}</p>
                        <p className="text-xs text-gray-500">主人: {owner?.name ?? "未知"} · 笼位: {cage?.name ?? "-"}</p>
                        <p className="text-xs text-gray-400">{format(parseISO(booking.startDate), "HH:mm")} 入住</p>
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <button
                    onClick={() => navigate(`/staff/checkin/${booking.id}`)}
                    className="mt-3 w-full py-3 bg-coral-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-coral-500 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                    扫码核销
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-3">在住宠物</h2>
        {inResidence.length === 0 ? (
          <Empty message="暂无在住宠物" />
        ) : (
          <div className="space-y-3">
            {inResidence.map((booking, idx) => {
              const pet = getPet(booking.petId)
              const cage = getCage(booking.cageId)
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={pet?.photoUrl || "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20pet%20placeholder&image_size=square"}
                      alt={pet?.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800">{pet?.name ?? "未知"}</p>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="text-xs text-gray-500">笼位: {cage?.name ?? "-"}</p>
                      <p className="text-xs text-gray-400">入住: {format(parseISO(booking.startDate), "MM月dd日")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/staff/diary/${booking.id}`)}
                      className="py-2.5 bg-mint-400/10 text-mint-400 font-semibold text-sm rounded-xl flex items-center justify-center gap-1 hover:bg-mint-400/20 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      看护日记
                    </button>
                    <button
                      onClick={() => navigate(`/staff/incident/${booking.id}`)}
                      className="py-2.5 bg-amber-500/10 text-amber-600 font-semibold text-sm rounded-xl flex items-center justify-center gap-1 hover:bg-amber-500/20 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                      异常记录
                    </button>
                    <button
                      onClick={() => navigate(`/staff/checkout/${booking.id}`)}
                      className="py-2.5 bg-coral-400/10 text-coral-400 font-semibold text-sm rounded-xl flex items-center justify-center gap-1 hover:bg-coral-400/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      离店结算
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
