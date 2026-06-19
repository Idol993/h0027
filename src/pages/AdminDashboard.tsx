import { useMemo } from "react"
import { motion } from "framer-motion"
import { BedDouble, LogIn, LogOut, Clock, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { useStore } from "@/store"
import StarRating from "@/components/StarRating"
import type { IncidentType, NotifyStatus } from "@/types"

const incidentTypeMap: Record<IncidentType, { label: string; color: string }> = {
  vomiting: { label: "呕吐", color: "bg-red-500" },
  refusing_food: { label: "拒食", color: "bg-amber-500" },
  injury: { label: "受伤", color: "bg-rose-600" },
  other: { label: "其他", color: "bg-gray-500" },
}

const notifyStatusMap: Record<NotifyStatus, { label: string; color: string }> = {
  sent: { label: "已通知", color: "text-yellow-400" },
  viewed: { label: "已查看", color: "text-mint-400" },
  reminded: { label: "已提醒", color: "text-coral-400" },
  escalated: { label: "已升级", color: "text-red-400" },
}

export default function AdminDashboard() {
  const getDashboardStats = useStore((s) => s.getDashboardStats)
  const incidents = useStore((s) => s.incidents)
  const bookings = useStore((s) => s.bookings)
  const pets = useStore((s) => s.pets)

  const stats = useMemo(() => getDashboardStats(), [getDashboardStats, bookings, incidents])

  const latestIncidents = useMemo(() => {
    const getPet = (bookingId: string) => {
      const booking = bookings.find((b) => b.id === bookingId)
      return booking ? pets.find((p) => p.id === booking.petId) : undefined
    }
    return [...incidents]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((i) => ({ ...i, petName: getPet(i.bookingId)?.name ?? "未知" }))
  }, [incidents, bookings, pets])

  const lineChartData = stats.monthlyBookings.map((d) => ({
    date: format(new Date(d.date), "MM/dd"),
    count: d.count,
  }))

  const pieData = stats.cageUsage.flatMap((c) => [
    { name: `${c.size === "small" ? "小" : c.size === "medium" ? "中" : "大"}笼-已用`, value: c.occupied, fill: "#4ECDC4" },
    { name: `${c.size === "small" ? "小" : c.size === "medium" ? "中" : "大"}笼-空闲`, value: c.total - c.occupied, fill: "#4B5563" },
  ])

  const maxRatingCount = Math.max(...stats.ratingDistribution.map((r) => r.count), 1)

  const ratingBarData = stats.ratingDistribution.map((r) => ({
    rating: `${r.rating}星`,
    count: r.count,
    fill: r.count / maxRatingCount,
  }))

  const statCards = [
    { label: "今日在住", value: stats.todayInResidence, icon: BedDouble, gradient: "from-coral-400 to-coral-500" },
    { label: "今日入住", value: stats.todayCheckins, icon: LogIn, gradient: "from-mint-400 to-mint-500" },
    { label: "今日离店", value: stats.todayCheckouts, icon: LogOut, gradient: "from-blue-500 to-blue-600" },
    { label: "待核销", value: stats.pendingCheckins, icon: Clock, gradient: "from-amber-500 to-amber-600" },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-display font-extrabold mb-6">管理后台</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm">{card.label}</p>
                <p className="text-3xl font-extrabold mt-1">{card.value}</p>
              </div>
              <card.icon className="w-10 h-10 text-white/40" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-2xl p-5"
        >
          <h2 className="text-base font-bold mb-4">本月预约趋势</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 12 }} stroke="#4B5563" />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} stroke="#4B5563" allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#fff" }}
              />
              <Line type="monotone" dataKey="count" stroke="#FF6B6B" strokeWidth={2} dot={{ fill: "#FF6B6B", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-2xl p-5"
        >
          <h2 className="text-base font-bold mb-4">笼位使用率</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8, color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-mint-400" />
              <span className="text-sm text-gray-400">已占用</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="text-sm text-gray-400">空闲</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-2xl p-5"
        >
          <h2 className="text-base font-bold mb-4">平均评分</h2>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl font-extrabold text-coral-400">{stats.averageRating}</span>
            <StarRating rating={Math.round(stats.averageRating)} size="lg" />
          </div>
          <div className="space-y-2">
            {ratingBarData.reverse().map((r) => (
              <div key={r.rating} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-8 text-right">{r.rating}</span>
                <div className="flex-1 h-5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                    style={{ width: `${r.fill * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-6">{r.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-2xl p-5"
        >
          <h2 className="text-base font-bold mb-4">最近异常事件</h2>
          {latestIncidents.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">暂无异常事件</p>
          ) : (
            <div className="space-y-3">
              {latestIncidents.map((incident) => {
                const typeConfig = incidentTypeMap[incident.type]
                const statusConfig = notifyStatusMap[incident.notifyStatus]
                return (
                  <div key={incident.id} className="flex items-center gap-3 bg-gray-700/50 rounded-xl p-3">
                    <span className={`${typeConfig.color} text-white text-xs px-2 py-1 rounded-lg font-semibold`}>
                      {typeConfig.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-sm font-semibold truncate">{incident.petName}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(incident.createdAt), "MM/dd HH:mm")}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
