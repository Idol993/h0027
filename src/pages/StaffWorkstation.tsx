import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ClipboardCheck, PawPrint, AlertTriangle, QrCode, BookOpen, AlertCircle, LogOut, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { format, parseISO, isSameDay, addDays, subDays } from "date-fns"
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
  const [viewDate, setViewDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))

  const checkinList = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" && isSameDay(parseISO(b.startDate), parseISO(viewDate))),
    [bookings, viewDate]
  )

  const inResidence = useMemo(
    () => bookings.filter((b) => {
      if (b.status === "checked_in") {
        if (b.checkinRecord) {
          const ci = parseISO(b.checkinRecord.checkedInAt)
          const vd = parseISO(viewDate)
          const ed = parseISO(b.endDate)
          return ci <= vd && ed >= vd
        }
        return true
      }
      return false
    }),
    [bookings, viewDate]
  )

  const checkoutList = useMemo(
    () => bookings.filter((b) => b.status === "checked_in" && isSameDay(parseISO(b.endDate), parseISO(viewDate))),
    [bookings, viewDate]
  )

  const dateIncidents = useMemo(
    () => incidents.filter((i) => isSameDay(parseISO(i.createdAt), parseISO(viewDate))),
    [incidents, viewDate]
  )

  const getPet = (petId: string) => pets.find((p) => p.id === petId)
  const getOwner = (ownerId: string) => users.find((u) => u.id === ownerId)
  const getCage = (cageId: string) => cages.find((c) => c.id === cageId)

  function shiftDate(delta: number) {
    const d = parseISO(viewDate)
    const next = delta > 0 ? addDays(d, delta) : subDays(d, -delta)
    setViewDate(format(next, "yyyy-MM-dd"))
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      <div className="bg-gradient-to-r from-coral-400 to-coral-500 px-6 py-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-extrabold">养护员工作站</h1>
            <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {format(parseISO(viewDate), "yyyy年MM月dd日 EEEE")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftDate(-1)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewDate(format(new Date(), "yyyy-MM-dd"))}
              className="px-3 h-9 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold transition-colors"
            >
              今天
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-4 text-center"
          >
            <ClipboardCheck className="w-6 h-6 text-coral-400 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-800">{checkinList.length}</p>
            <p className="text-xs text-gray-500">待核销</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl shadow-card p-4 text-center"
          >
            <PawPrint className="w-6 h-6 text-mint-400 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-800">{inResidence.length}</p>
            <p className="text-xs text-gray-500">在住宠物</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-card p-4 text-center"
          >
            <LogOut className="w-6 h-6 text-coral-500 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-800">{checkoutList.length}</p>
            <p className="text-xs text-gray-500">待离店</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-card p-4 text-center"
          >
            <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-extrabold text-gray-800">{dateIncidents.length}</p>
            <p className="text-xs text-gray-500">当日异常</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-3">
          {format(parseISO(viewDate), "MM月dd日")} 待核销
        </h2>
        {checkinList.length === 0 ? (
          <Empty message="该日期无待核销预约" />
        ) : (
          <div className="space-y-3">
            {checkinList.map((booking, idx) => {
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
                        <p className="text-xs text-gray-400">预约 {format(parseISO(booking.startDate), "HH:mm")} 入住</p>
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

      <div className="max-w-4xl mx-auto px-4 mt-6">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-3">
          在住宠物（截至 {format(parseISO(viewDate), "MM月dd日")}）
        </h2>
        {inResidence.length === 0 ? (
          <Empty message="暂无在住宠物" />
        ) : (
          <div className="space-y-3">
            {inResidence.map((booking, idx) => {
              const pet = getPet(booking.petId)
              const cage = getCage(booking.cageId)
              const isCheckoutToday = checkoutList.some((c) => c.id === booking.id)
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`bg-white rounded-2xl shadow-card p-4 ${isCheckoutToday ? "ring-2 ring-coral-300" : ""}`}
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
                        {isCheckoutToday && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral-100 text-coral-600 font-bold">今日离店</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">笼位: {cage?.name ?? "-"}</p>
                      <p className="text-xs text-gray-400">
                        入住: {format(parseISO(booking.startDate), "MM月dd日")} · 预计离店: {format(parseISO(booking.endDate), "MM月dd日")}
                      </p>
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
