import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, RotateCcw, Download, ChevronLeft, ChevronRight, X, FileText, DollarSign, Star, AlertTriangle } from "lucide-react"
import { format, parseISO, subMonths } from "date-fns"
import { useStore } from "@/store"
import StarRating from "@/components/StarRating"
import StatusBadge from "@/components/StatusBadge"
import type { IncidentType, CageSize, BookingStatus, User } from "@/types"

type TabKey = "bookings" | "reviews" | "incidents"

const incidentTypeOptions: { value: IncidentType | ""; label: string }[] = [
  { value: "", label: "全部" },
  { value: "vomiting", label: "呕吐" },
  { value: "refusing_food", label: "拒食" },
  { value: "injury", label: "受伤" },
  { value: "other", label: "其他" },
]

const ratingOptions = [
  { value: 0, label: "全部" },
  { value: 1, label: "1星" },
  { value: 2, label: "2星" },
  { value: 3, label: "3星" },
  { value: 4, label: "4星" },
  { value: 5, label: "5星" },
]

const cageSizeOptions: { value: CageSize | ""; label: string }[] = [
  { value: "", label: "全部笼位" },
  { value: "small", label: "小型笼" },
  { value: "medium", label: "中型笼" },
  { value: "large", label: "大型笼" },
]

const statusOptions: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待确认" },
  { value: "confirmed", label: "已确认" },
  { value: "checked_in", label: "在住中" },
  { value: "checked_out", label: "已离店" },
  { value: "cancelled", label: "已取消" },
]

const incidentTypeLabel: Record<IncidentType, string> = {
  vomiting: "呕吐",
  refusing_food: "拒食",
  injury: "受伤",
  other: "其他",
}

const PAGE_SIZE = 10

export default function AdminReports() {
  const getFilteredRecords = useStore((s) => s.getFilteredRecords)
  const bookings = useStore((s) => s.bookings)
  const reviews = useStore((s) => s.reviews)
  const incidents = useStore((s) => s.incidents)
  const pets = useStore((s) => s.pets)
  const users = useStore((s) => s.users)
  const cages = useStore((s) => s.cages)

  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [ratingFilter, setRatingFilter] = useState(0)
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<IncidentType | "">("")
  const [ownerIdFilter, setOwnerIdFilter] = useState("")
  const [cageSizeFilter, setCageSizeFilter] = useState<CageSize | "">("")
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("")
  const [activeTab, setActiveTab] = useState<TabKey>("bookings")
  const [page, setPage] = useState(1)
  const [showExportModal, setShowExportModal] = useState(false)

  const ownerOptions = useMemo(() => {
    const owners = users.filter((u) => u.role === "owner")
    return [{ id: "", name: "全部主人" }, ...owners]
  }, [users])

  const getPet = (petId: string) => pets.find((p) => p.id === petId)
  const getOwner = (ownerId: string) => users.find((u) => u.id === ownerId)
  const getCage = (cageId: string) => cages.find((c) => c.id === cageId)

  const filteredBookings = useMemo(() => {
    return getFilteredRecords({
      startDate,
      endDate,
      rating: ratingFilter > 0 ? ratingFilter : undefined,
      incidentType: incidentTypeFilter || undefined,
      ownerId: ownerIdFilter || undefined,
      cageSize: cageSizeFilter || undefined,
      status: statusFilter || undefined,
    })
  }, [getFilteredRecords, startDate, endDate, ratingFilter, incidentTypeFilter, ownerIdFilter, cageSizeFilter, statusFilter])

  const filteredReviews = useMemo(() => {
    const bookingIds = new Set(filteredBookings.map((b) => b.id))
    return reviews.filter((r) => {
      if (!bookingIds.has(r.bookingId)) return false
      if (ratingFilter > 0 && r.rating !== ratingFilter) return false
      return true
    })
  }, [reviews, filteredBookings, ratingFilter])

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const iDate = i.createdAt.split("T")[0]
      if (startDate && iDate < startDate) return false
      if (endDate && iDate > endDate) return false
      if (incidentTypeFilter && i.type !== incidentTypeFilter) return false
      return true
    })
  }, [incidents, startDate, endDate, incidentTypeFilter])

  const summaryStats = useMemo(() => {
    const completedBookings = filteredBookings.filter((b) => b.status === "checked_out" && b.bill)
    const totalIncome = completedBookings.reduce((sum, b) => sum + (b.bill?.total ?? 0), 0)
    const avgRating = filteredReviews.length > 0
      ? Math.round((filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length) * 10) / 10
      : 0

    const depositIncome = filteredBookings.reduce((sum, b) => {
      const p = b.payments?.find((p) => p.type === "deposit")
      return sum + (p?.amount ?? 0)
    }, 0)
    const balanceIncome = filteredBookings.reduce((sum, b) => {
      const p = b.payments?.find((p) => p.type === "balance")
      return sum + (p?.amount ?? 0)
    }, 0)
    const refunds = filteredBookings.reduce((sum, b) => {
      return sum + (b.refunds?.reduce((s, r) => s + r.amount, 0) ?? 0)
    }, 0)
    const extrasIncome = completedBookings.reduce((sum, b) => {
      return sum + (b.bill?.extras?.reduce((s, e) => s + e.amount, 0) ?? 0)
    }, 0)
    const netIncome = depositIncome + balanceIncome - refunds + extrasIncome

    return {
      totalIncome,
      avgRating,
      completedCount: completedBookings.length,
      reviewCount: filteredReviews.length,
      depositIncome,
      balanceIncome,
      refunds,
      extrasIncome,
      netIncome,
    }
  }, [filteredBookings, filteredReviews])

  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredBookings.slice(start, start + PAGE_SIZE)
  }, [filteredBookings, page])

  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredReviews.slice(start, start + PAGE_SIZE)
  }, [filteredReviews, page])

  const paginatedIncidents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredIncidents.slice(start, start + PAGE_SIZE)
  }, [filteredIncidents, page])

  const totalPages = useMemo(() => {
    const count =
      activeTab === "bookings"
        ? filteredBookings.length
        : activeTab === "reviews"
        ? filteredReviews.length
        : filteredIncidents.length
    return Math.max(1, Math.ceil(count / PAGE_SIZE))
  }, [activeTab, filteredBookings, filteredReviews, filteredIncidents])

  const handleSearch = () => {
    setPage(1)
  }

  const handleReset = () => {
    setStartDate(format(subMonths(new Date(), 1), "yyyy-MM-dd"))
    setEndDate(format(new Date(), "yyyy-MM-dd"))
    setRatingFilter(0)
    setIncidentTypeFilter("")
    setOwnerIdFilter("")
    setCageSizeFilter("")
    setStatusFilter("")
    setPage(1)
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    setPage(1)
  }

  const exportMonthlySummary = useMemo(() => {
    const completedBookings = filteredBookings.filter((b) => b.status === "checked_out" && b.bill)
    const orderDetails = completedBookings.map((b) => {
      const pet = getPet(b.petId)
      const owner = getOwner(b.ownerId)
      const cage = getCage(b.cageId)
      return {
        id: b.id.slice(-4).toUpperCase(),
        petName: pet?.name ?? "未知",
        ownerName: owner?.name ?? "未知",
        cageName: cage?.name ?? "-",
        startDate: b.startDate,
        endDate: b.actualEndDate ?? b.endDate,
        days: b.bill?.days ?? 0,
        total: b.bill?.total ?? 0,
      }
    })
    const reviewSummary = filteredReviews.map((r) => {
      const owner = getOwner(r.ownerId)
      const booking = bookings.find((b) => b.id === r.bookingId)
      const pet = booking ? getPet(booking.petId) : undefined
      return { rating: r.rating, content: r.content, ownerName: owner?.name ?? "未知", petName: pet?.name ?? "-", date: r.createdAt }
    })
    const incidentSummary = filteredIncidents.map((i) => {
      const booking = bookings.find((b) => b.id === i.bookingId)
      const pet = booking ? getPet(booking.petId) : undefined
      const owner = booking ? getOwner(booking.ownerId) : undefined
      return {
        type: incidentTypeLabel[i.type],
        description: i.description,
        petName: pet?.name ?? "-",
        ownerName: owner?.name ?? "-",
        status: i.notifyStatus === "sent" ? "已通知" : i.notifyStatus === "viewed" ? "已查看" : i.notifyStatus === "reminded" ? "已提醒" : "已升级",
        time: i.createdAt,
      }
    })
    const incidentStats: Record<string, number> = {}
    filteredIncidents.forEach((i) => {
      const label = incidentTypeLabel[i.type]
      incidentStats[label] = (incidentStats[label] || 0) + 1
    })
    return {
      orderDetails,
      reviewSummary,
      incidentSummary,
      incidentStats,
      totalIncome: summaryStats.totalIncome,
      avgRating: summaryStats.avgRating,
      depositIncome: summaryStats.depositIncome,
      balanceIncome: summaryStats.balanceIncome,
      refunds: summaryStats.refunds,
      extrasIncome: summaryStats.extrasIncome,
      netIncome: summaryStats.netIncome,
    }
  }, [filteredBookings, filteredReviews, filteredIncidents, bookings, pets, users, cages, summaryStats.totalIncome, summaryStats.avgRating, summaryStats.depositIncome, summaryStats.balanceIncome, summaryStats.refunds, summaryStats.extrasIncome, summaryStats.netIncome])

  function generateCSV(): string {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const lines: string[] = []
    lines.push("毛孩寄养月度报表")
    lines.push(`筛选日期,${esc(startDate)} ~ ${esc(endDate)}`)
    lines.push(`生成时间,${esc(format(new Date(), "yyyy-MM-dd HH:mm:ss"))}`)
    lines.push("")
    lines.push("=== 财务汇总 ===")
    lines.push(`收入总额,${esc(exportMonthlySummary.totalIncome)}`)
    lines.push(`订金收入,${esc(exportMonthlySummary.depositIncome)}`)
    lines.push(`尾款收入,${esc(exportMonthlySummary.balanceIncome)}`)
    lines.push(`退款支出,${esc(exportMonthlySummary.refunds)}`)
    lines.push(`额外费用,${esc(exportMonthlySummary.extrasIncome)}`)
    lines.push(`净收入,${esc(exportMonthlySummary.netIncome)}`)
    lines.push(`已完成订单数,${esc(exportMonthlySummary.orderDetails.length)}`)
    lines.push(`平均评分,${esc(exportMonthlySummary.avgRating)}`)
    lines.push("")
    lines.push("=== 订单明细 ===")
    lines.push(["编号", "宠物", "主人", "笼位", "入住日期", "离店日期", "天数", "订单总额", "订金", "尾款", "退款", "额外费用", "支付状态"].map(esc).join(","))
    exportMonthlySummary.orderDetails.forEach((d, idx) => {
      const booking = filteredBookings.filter((b) => b.status === "checked_out" && b.bill)[idx]
      const depositPaid = booking?.payments?.some((p) => p.type === "deposit") ? "已付" : "未付"
      const balancePaid = booking?.payments?.some((p) => p.type === "balance") ? "已付" : "未付"
      const refundsTotal = booking?.refunds?.reduce((s, r) => s + r.amount, 0) ?? 0
      const extrasTotal = booking?.bill?.extras?.reduce((s, e) => s + e.amount, 0) ?? 0
      const payStatus = depositPaid === "已付" && balancePaid === "已付" ? "已结清" : "部分支付"
      lines.push([
        d.id, d.petName, d.ownerName, d.cageName, d.startDate, d.endDate, d.days,
        d.total, booking?.depositAmount ?? 0, booking?.balanceAmount ?? 0, refundsTotal, extrasTotal, payStatus
      ].map(esc).join(","))
    })
    lines.push("")
    lines.push("=== 支付记录明细 ===")
    lines.push(["订单编号", "支付类型", "金额", "支付时间"].map(esc).join(","))
    filteredBookings.forEach((b) => {
      b.payments?.forEach((p) => {
        lines.push([
          b.id.slice(-4).toUpperCase(),
          p.type === "deposit" ? "订金" : "尾款",
          p.amount,
          format(parseISO(p.paidAt), "yyyy-MM-dd HH:mm")
        ].map(esc).join(","))
      })
    })
    lines.push("")
    lines.push("=== 退款记录明细 ===")
    lines.push(["订单编号", "退款金额", "原因", "距离入住天数", "退款时间"].map(esc).join(","))
    filteredBookings.forEach((b) => {
      b.refunds?.forEach((r) => {
        lines.push([
          b.id.slice(-4).toUpperCase(),
          r.amount,
          r.reason === "cancellation" ? "取消退款" : "退款",
          r.daysBeforeCheckin,
          format(parseISO(r.refundedAt), "yyyy-MM-dd HH:mm")
        ].map(esc).join(","))
      })
    })
    lines.push("")
    lines.push("=== 评价汇总 ===")
    lines.push(["星级", "内容", "主人", "宠物", "日期"].map(esc).join(","))
    exportMonthlySummary.reviewSummary.forEach((r) => {
      lines.push([r.rating, r.content, r.ownerName, r.petName, r.date].map(esc).join(","))
    })
    lines.push("")
    lines.push("=== 异常统计 ===")
    lines.push(["类型", "数量"].map(esc).join(","))
    Object.entries(exportMonthlySummary.incidentStats).forEach(([k, v]) => {
      lines.push([k, v].map(esc).join(","))
    })
    if (exportMonthlySummary.incidentSummary.length > 0) {
      lines.push("")
      lines.push("=== 异常明细 ===")
      lines.push(["类型", "描述", "宠物", "主人", "状态", "时间"].map(esc).join(","))
      exportMonthlySummary.incidentSummary.forEach((i) => {
        lines.push([i.type, i.description, i.petName, i.ownerName, i.status, i.time].map(esc).join(","))
      })
    }
    return "\uFEFF" + lines.join("\n")
  }

  function generateTXT(): string {
    const pad = (s: string | number, w = 12) => String(s).padEnd(w, " ")
    const lines: string[] = []
    lines.push("========================================")
    lines.push("        毛孩寄养 - 月度运营报表         ")
    lines.push("========================================")
    lines.push(`筛选日期：${startDate} ~ ${endDate}`)
    lines.push(`生成时间：${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`)
    lines.push("")
    lines.push("【财务汇总】")
    lines.push(`  收入总额：¥${exportMonthlySummary.totalIncome.toLocaleString()}`)
    lines.push(`  订金收入：¥${exportMonthlySummary.depositIncome.toLocaleString()}`)
    lines.push(`  尾款收入：¥${exportMonthlySummary.balanceIncome.toLocaleString()}`)
    lines.push(`  退款支出：-¥${exportMonthlySummary.refunds.toLocaleString()}`)
    lines.push(`  额外费用：+¥${exportMonthlySummary.extrasIncome.toLocaleString()}`)
    lines.push(`  净  收  入：¥${exportMonthlySummary.netIncome.toLocaleString()}`)
    lines.push(`  已完成订单：${exportMonthlySummary.orderDetails.length} 笔`)
    lines.push(`  平均评分：${exportMonthlySummary.avgRating} 星`)
    lines.push("")
    lines.push("【订单明细】")
    if (exportMonthlySummary.orderDetails.length === 0) {
      lines.push("  （暂无数据）")
    } else {
      lines.push(`  ${pad("编号", 6)}${pad("宠物", 8)}${pad("主人", 8)}${pad("笼位", 8)}${pad("入住", 12)}${pad("离店", 12)}${pad("天数", 6)}${pad("总额", 8)}${pad("订金", 7)}${pad("尾款", 7)}支付`)
      exportMonthlySummary.orderDetails.forEach((d, idx) => {
        const booking = filteredBookings.filter((b) => b.status === "checked_out" && b.bill)[idx]
        const depositPaid = booking?.payments?.some((p) => p.type === "deposit") ? "已付" : "未付"
        const balancePaid = booking?.payments?.some((p) => p.type === "balance") ? "已付" : "未付"
        const payStatus = depositPaid === "已付" && balancePaid === "已付" ? "已结清" : "未结清"
        lines.push(`  ${pad(d.id, 6)}${pad(d.petName, 8)}${pad(d.ownerName, 8)}${pad(d.cageName, 8)}${pad(d.startDate, 12)}${pad(d.endDate, 12)}${pad(d.days + "天", 6)}${pad("¥" + d.total, 8)}${pad("¥" + (booking?.depositAmount ?? 0), 7)}${pad("¥" + (booking?.balanceAmount ?? 0), 7)}${payStatus}`)
      })
    }
    lines.push("")
    lines.push("【支付记录】")
    const allPayments: { bookingId: string; type: string; amount: number; paidAt: string }[] = []
    filteredBookings.forEach((b) => {
      b.payments?.forEach((p) => {
        allPayments.push({
          bookingId: b.id.slice(-4).toUpperCase(),
          type: p.type === "deposit" ? "订金" : "尾款",
          amount: p.amount,
          paidAt: format(parseISO(p.paidAt), "MM-dd HH:mm"),
        })
      })
    })
    if (allPayments.length === 0) {
      lines.push("  （暂无数据）")
    } else {
      lines.push(`  ${pad("订单", 6)}${pad("类型", 6)}${pad("金额", 10)}时间`)
      allPayments.forEach((p) => {
        lines.push(`  ${pad(p.bookingId, 6)}${pad(p.type, 6)}${pad("¥" + p.amount, 10)}${p.paidAt}`)
      })
    }
    lines.push("")
    lines.push("【退款记录】")
    const allRefunds: { bookingId: string; amount: number; reason: string; daysBefore: number; refundedAt: string }[] = []
    filteredBookings.forEach((b) => {
      b.refunds?.forEach((r) => {
        allRefunds.push({
          bookingId: b.id.slice(-4).toUpperCase(),
          amount: r.amount,
          reason: r.reason === "cancellation" ? "取消退款" : "退款",
          daysBefore: r.daysBeforeCheckin,
          refundedAt: format(parseISO(r.refundedAt), "MM-dd HH:mm"),
        })
      })
    })
    if (allRefunds.length === 0) {
      lines.push("  （暂无数据）")
    } else {
      lines.push(`  ${pad("订单", 6)}${pad("金额", 10)}${pad("原因", 10)}${pad("距入住", 8)}时间`)
      allRefunds.forEach((r) => {
        lines.push(`  ${pad(r.bookingId, 6)}${pad("-¥" + r.amount, 10)}${pad(r.reason, 10)}${pad(r.daysBefore + "天", 8)}${r.refundedAt}`)
      })
    }
    lines.push("")
    lines.push("【评价汇总】")
    if (exportMonthlySummary.reviewSummary.length === 0) {
      lines.push("  （暂无数据）")
    } else {
      exportMonthlySummary.reviewSummary.forEach((r, i) => {
        lines.push(`  ${i + 1}. [${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}] ${r.ownerName}（${r.petName}） - ${r.date}`)
        lines.push(`     ${r.content}`)
      })
    }
    lines.push("")
    lines.push("【异常统计】")
    if (Object.keys(exportMonthlySummary.incidentStats).length === 0) {
      lines.push("  （暂无异常）")
    } else {
      Object.entries(exportMonthlySummary.incidentStats).forEach(([k, v]) => {
        lines.push(`  ${k}：${v} 起`)
      })
      if (exportMonthlySummary.incidentSummary.length > 0) {
        lines.push("")
        lines.push("  异常明细：")
        exportMonthlySummary.incidentSummary.forEach((i, idx) => {
          lines.push(`    ${idx + 1}. [${i.type}] ${i.petName}（${i.ownerName}）- ${i.status}`)
          lines.push(`       ${i.description}`)
          lines.push(`       ${i.time}`)
        })
      }
    }
    lines.push("")
    lines.push("========================================")
    return lines.join("\n")
  }

  function triggerDownload(filename: string, content: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleDownloadCSV() {
    const dateStr = format(new Date(), "yyyyMMdd")
    triggerDownload(`monthly-report-${dateStr}.csv`, generateCSV(), "text/csv;charset=utf-8")
  }

  function handleDownloadTXT() {
    const dateStr = format(new Date(), "yyyyMMdd")
    triggerDownload(`monthly-report-${dateStr}.txt`, generateTXT(), "text/plain;charset=utf-8")
  }

  return (
    <div className="min-h-screen bg-cream-100 flex">
      <div className="w-80 bg-white shadow-card p-6 flex flex-col shrink-0">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-6">筛选条件</h2>

        <div className="space-y-5 flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">日期范围</label>
            <div className="space-y-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400/50 focus:border-coral-400"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400/50 focus:border-coral-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">评价星级</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400/50 focus:border-coral-400"
            >
              {ratingOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">异常类型</label>
            <select
              value={incidentTypeFilter}
              onChange={(e) => setIncidentTypeFilter(e.target.value as IncidentType | "")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400/50 focus:border-coral-400"
            >
              {incidentTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">宠物主人</label>
            <select
              value={ownerIdFilter}
              onChange={(e) => setOwnerIdFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400/50 focus:border-coral-400"
            >
              {ownerOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">笼位类型</label>
            <select
              value={cageSizeFilter}
              onChange={(e) => setCageSizeFilter(e.target.value as CageSize | "")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400/50 focus:border-coral-400"
            >
              {cageSizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">订单状态</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-coral-400/50 focus:border-coral-400"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 py-2.5 bg-coral-400 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-coral-500 transition-colors"
            >
              <Search className="w-4 h-4" />
              查询
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="mt-6 w-full py-3 bg-mint-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-mint-500 transition-colors"
        >
          <Download className="w-5 h-5" />
          导出报表
        </button>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-coral-400/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-coral-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">筛选收入总额</p>
              <p className="text-2xl font-extrabold text-coral-400">¥{summaryStats.totalIncome.toLocaleString()}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">筛选平均评分</p>
              <p className="text-2xl font-extrabold text-amber-500">{summaryStats.avgRating}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-mint-400/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-mint-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">已完成订单</p>
              <p className="text-2xl font-extrabold text-gray-800">{summaryStats.completedCount}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">净收入</p>
              <p className="text-2xl font-extrabold text-gray-800">¥{summaryStats.netIncome.toLocaleString()}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-mint-50 border-2 border-mint-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-mint-700 mb-1">订金收入</p>
            <p className="text-xl font-extrabold text-mint-600">¥{summaryStats.depositIncome.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">尾款收入</p>
            <p className="text-xl font-extrabold text-blue-600">¥{summaryStats.balanceIncome.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-coral-50 border-2 border-coral-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-coral-700 mb-1">退款支出</p>
            <p className="text-xl font-extrabold text-coral-500">-¥{summaryStats.refunds.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-purple-700 mb-1">额外费用</p>
            <p className="text-xl font-extrabold text-purple-600">+¥{summaryStats.extrasIncome.toLocaleString()}</p>
          </motion.div>
        </div>

        <div className="flex gap-2 mb-5">
          {([
            { key: "bookings" as TabKey, label: "预约记录" },
            { key: "reviews" as TabKey, label: "评价记录" },
            { key: "incidents" as TabKey, label: "异常记录" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-coral-400 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden"
        >
          {activeTab === "bookings" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left py-3 px-4 font-semibold">编号</th>
                  <th className="text-left py-3 px-4 font-semibold">宠物名</th>
                  <th className="text-left py-3 px-4 font-semibold">主人</th>
                  <th className="text-left py-3 px-4 font-semibold">笼位</th>
                  <th className="text-left py-3 px-4 font-semibold">起止日期</th>
                  <th className="text-left py-3 px-4 font-semibold">状态</th>
                  <th className="text-right py-3 px-4 font-semibold">费用</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((b) => {
                  const pet = getPet(b.petId)
                  const owner = getOwner(b.ownerId)
                  const cage = getCage(b.cageId)
                  return (
                    <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-600">{b.id.slice(-4).toUpperCase()}</td>
                      <td className="py-3 px-4 font-semibold text-gray-800">{pet?.name ?? "未知"}</td>
                      <td className="py-3 px-4 text-gray-600">{owner?.name ?? "未知"}</td>
                      <td className="py-3 px-4 text-gray-600">{cage?.name ?? "-"}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {format(parseISO(b.startDate), "MM/dd")} - {format(parseISO(b.endDate), "MM/dd")}
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-800">
                        {b.bill ? `¥${b.bill.total}` : `¥${b.dailyRate}/天`}
                      </td>
                    </tr>
                  )
                })}
                {paginatedBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "reviews" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left py-3 px-4 font-semibold">宠物名</th>
                  <th className="text-left py-3 px-4 font-semibold">主人</th>
                  <th className="text-left py-3 px-4 font-semibold">星级</th>
                  <th className="text-left py-3 px-4 font-semibold">评价内容</th>
                  <th className="text-left py-3 px-4 font-semibold">日期</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReviews.map((r) => {
                  const booking = bookings.find((b) => b.id === r.bookingId)
                  const pet = booking ? getPet(booking.petId) : undefined
                  const owner = getOwner(r.ownerId)
                  return (
                    <tr key={r.bookingId} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-800">{pet?.name ?? "未知"}</td>
                      <td className="py-3 px-4 text-gray-600">{owner?.name ?? "未知"}</td>
                      <td className="py-3 px-4"><StarRating rating={r.rating} size="sm" /></td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{r.content}</td>
                      <td className="py-3 px-4 text-gray-400">{format(parseISO(r.createdAt), "yyyy/MM/dd")}</td>
                    </tr>
                  )
                })}
                {paginatedReviews.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "incidents" && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left py-3 px-4 font-semibold">宠物名</th>
                  <th className="text-left py-3 px-4 font-semibold">类型</th>
                  <th className="text-left py-3 px-4 font-semibold">描述</th>
                  <th className="text-left py-3 px-4 font-semibold">处理状态</th>
                  <th className="text-left py-3 px-4 font-semibold">时间</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIncidents.map((i) => {
                  const booking = bookings.find((b) => b.id === i.bookingId)
                  const pet = booking ? getPet(booking.petId) : undefined
                  return (
                    <tr key={i.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-semibold text-gray-800">{pet?.name ?? "未知"}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold">
                          {incidentTypeLabel[i.type]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{i.description}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            i.notifyStatus === "viewed"
                              ? "text-mint-400"
                              : i.notifyStatus === "escalated"
                              ? "text-red-500"
                              : i.notifyStatus === "reminded"
                              ? "text-coral-400"
                              : "text-amber-500"
                          }`}
                        >
                          {i.notifyStatus === "sent"
                            ? "已通知"
                            : i.notifyStatus === "viewed"
                            ? "已查看"
                            : i.notifyStatus === "reminded"
                            ? "已提醒"
                            : "已升级"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {format(parseISO(i.createdAt), "yyyy/MM/dd HH:mm")}
                      </td>
                    </tr>
                  )
                })}
                {paginatedIncidents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </motion.div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            共{" "}
            {activeTab === "bookings"
              ? filteredBookings.length
              : activeTab === "reviews"
              ? filteredReviews.length
              : filteredIncidents.length}{" "}
            条记录
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-white shadow-card disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600 font-semibold">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-white shadow-card disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {showExportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowExportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-card-hover p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-display font-bold text-gray-800">报表导出预览</h2>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-coral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-coral-400" />
                  收入合计
                </h3>
                <div className="bg-coral-50 rounded-2xl p-4 mb-3">
                  <p className="text-3xl font-extrabold text-coral-400">¥{exportMonthlySummary.totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {startDate} ~ {endDate} 期间 {exportMonthlySummary.orderDetails.length} 笔已完成订单
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-mint-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-mint-700 font-medium">订金收入</span>
                    <span className="font-bold text-mint-600">¥{exportMonthlySummary.depositIncome.toLocaleString()}</span>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-blue-700 font-medium">尾款收入</span>
                    <span className="font-bold text-blue-600">¥{exportMonthlySummary.balanceIncome.toLocaleString()}</span>
                  </div>
                  <div className="bg-coral-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-coral-700 font-medium">退款支出</span>
                    <span className="font-bold text-coral-500">-¥{exportMonthlySummary.refunds.toLocaleString()}</span>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-purple-700 font-medium">额外费用</span>
                    <span className="font-bold text-purple-600">+¥{exportMonthlySummary.extrasIncome.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-3 bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">净收入</span>
                  <span className="text-xl font-extrabold text-gray-800">¥{exportMonthlySummary.netIncome.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-mint-500" />
                  订单明细
                </h3>
                {exportMonthlySummary.orderDetails.length === 0 ? (
                  <p className="text-sm text-gray-400">暂无已完成订单</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500">
                          <th className="text-left py-2 px-3 font-semibold">编号</th>
                          <th className="text-left py-2 px-3 font-semibold">宠物</th>
                          <th className="text-left py-2 px-3 font-semibold">主人</th>
                          <th className="text-left py-2 px-3 font-semibold">笼位</th>
                          <th className="text-left py-2 px-3 font-semibold">入住-离店</th>
                          <th className="text-left py-2 px-3 font-semibold">天数</th>
                          <th className="text-right py-2 px-3 font-semibold">金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportMonthlySummary.orderDetails.map((d) => (
                          <tr key={d.id} className="border-t border-gray-100">
                            <td className="py-2 px-3 text-gray-600">{d.id}</td>
                            <td className="py-2 px-3 font-semibold text-gray-800">{d.petName}</td>
                            <td className="py-2 px-3 text-gray-600">{d.ownerName}</td>
                            <td className="py-2 px-3 text-gray-600">{d.cageName}</td>
                            <td className="py-2 px-3 text-gray-600">{d.startDate} ~ {d.endDate}</td>
                            <td className="py-2 px-3 text-gray-600">{d.days}天</td>
                            <td className="py-2 px-3 text-right font-semibold text-coral-400">¥{d.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  评价汇总（{exportMonthlySummary.reviewSummary.length}条）
                </h3>
                {exportMonthlySummary.reviewSummary.length === 0 ? (
                  <p className="text-sm text-gray-400">暂无评价</p>
                ) : (
                  <div className="space-y-2">
                    {exportMonthlySummary.reviewSummary.map((r, idx) => (
                      <div key={idx} className="bg-cream-100 rounded-xl p-3 flex items-start gap-3">
                        <StarRating rating={r.rating} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{r.content}</p>
                          <p className="text-xs text-gray-400 mt-1">{r.ownerName} · {r.petName} · {r.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  异常统计
                </h3>
                {Object.keys(exportMonthlySummary.incidentStats).length === 0 ? (
                  <p className="text-sm text-gray-400">暂无异常</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(exportMonthlySummary.incidentStats).map(([k, v]) => (
                      <div key={k} className="bg-amber-50 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-amber-700">{k}</span>
                        <span className="text-xl font-extrabold text-amber-600">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={handleDownloadCSV}
                className="py-3 bg-mint-400 text-white font-bold rounded-xl hover:bg-mint-500 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载 CSV
              </button>
              <button
                onClick={handleDownloadTXT}
                className="py-3 bg-coral-400 text-white font-bold rounded-xl hover:bg-coral-500 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载 TXT
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="w-full mt-3 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              关闭
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
