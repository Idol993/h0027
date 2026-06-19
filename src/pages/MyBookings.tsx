import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useStore } from "@/store"
import StatusBadge from "@/components/StatusBadge"
import Empty from "@/components/Empty"
import type { BookingStatus } from "@/types"

const tabs: { key: BookingStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "confirmed", label: "已确认" },
  { key: "checked_in", label: "在住中" },
  { key: "checked_out", label: "已离店" },
  { key: "cancelled", label: "已取消" },
]

const statusBorderColor: Record<BookingStatus, string> = {
  pending: "border-l-amber-400",
  confirmed: "border-l-mint-400",
  checked_in: "border-l-coral-400",
  checked_out: "border-l-gray-400",
  cancelled: "border-l-gray-300",
}

export default function MyBookings() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const getBookingsByOwner = useStore((s) => s.getBookingsByOwner)
  const cages = useStore((s) => s.cages)
  const pets = useStore((s) => s.pets)
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all")

  const bookings = useMemo(() => {
    if (!currentUser) return []
    return getBookingsByOwner(currentUser.id)
  }, [currentUser, getBookingsByOwner])

  const filtered = useMemo(() => {
    if (activeTab === "all") return bookings
    return bookings.filter((b) => b.status === activeTab)
  }, [bookings, activeTab])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-display font-bold text-gray-800 mb-4">我的预约</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: "none" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-coral-400 text-white shadow-card"
                : "bg-white text-gray-500 hover:bg-cream-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty message="暂无预约记录" />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, idx) => {
            const cage = cages.find((c) => c.id === booking.cageId)
            const pet = pets.find((p) => p.id === booking.petId)
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/my-bookings/${booking.id}`)}
                className={`bg-white rounded-2xl shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow border-l-4 ${statusBorderColor[booking.status]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-800">
                    {pet?.name ?? "未知宠物"}
                  </span>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {cage?.name ?? "-"} · {booking.startDate} ~ {booking.endDate}
                  </span>
                  <span className="font-semibold text-coral-400">
                    ¥{booking.dailyRate}/天
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
