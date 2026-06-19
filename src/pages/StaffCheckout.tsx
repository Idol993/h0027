import { useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Plus, X, Check, Receipt } from "lucide-react"
import { format, parseISO, differenceInCalendarDays } from "date-fns"
import { useStore } from "@/store"
import type { BillExtra } from "@/types"

export default function StaffCheckout() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const bookings = useStore((s) => s.bookings)
  const pets = useStore((s) => s.pets)
  const cages = useStore((s) => s.cages)
  const checkOutBooking = useStore((s) => s.checkOutBooking)

  const [extras, setExtras] = useState<BillExtra[]>([])
  const [extraName, setExtraName] = useState("")
  const [extraAmount, setExtraAmount] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [billData, setBillData] = useState<{ days: number; dailyRate: number; subtotal: number; extrasTotal: number; total: number } | null>(null)

  const booking = bookings.find((b) => b.id === bookingId)
  const pet = booking ? pets.find((p) => p.id === booking.petId) : null
  const cage = booking ? cages.find((c) => c.id === booking.cageId) : null

  const days = useMemo(() => {
    if (!booking) return 0
    return Math.max(1, differenceInCalendarDays(new Date(), parseISO(booking.startDate)))
  }, [booking])

  const subtotal = booking ? days * booking.dailyRate : 0
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0)
  const total = subtotal + extrasTotal

  if (!booking) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <p className="text-gray-500">预约不存在</p>
      </div>
    )
  }

  const handleAddExtra = () => {
    if (!extraName.trim() || !extraAmount) return
    setExtras((prev) => [...prev, { name: extraName.trim(), amount: Number(extraAmount) }])
    setExtraName("")
    setExtraAmount("")
  }

  const handleRemoveExtra = (index: number) => {
    setExtras((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCheckout = () => {
    setBillData({ days, dailyRate: booking.dailyRate, subtotal, extrasTotal, total })
    checkOutBooking(booking.id)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate("/staff")} className="text-gray-600">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="font-display font-bold text-gray-800">离店结算</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-800 mb-3">预约信息</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">宠物名称</span>
              <span className="font-semibold text-gray-800">{pet?.name ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">入住日期</span>
              <span className="font-semibold text-gray-800">{format(parseISO(booking.startDate), "yyyy-MM-dd")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">笼位</span>
              <span className="font-semibold text-gray-800">{cage?.name ?? "-"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-800 mb-3">费用明细</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">住宿天数</span>
              <span className="font-semibold text-gray-800">{days} 天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">日费率</span>
              <span className="font-semibold text-gray-800">¥{booking.dailyRate}/天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">小计</span>
              <span className="font-semibold text-gray-800">¥{subtotal}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">额外费用</h3>
            </div>
            {extras.length > 0 && (
              <div className="space-y-2 mb-3">
                {extras.map((extra, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700">{extra.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">¥{extra.amount}</span>
                      <button onClick={() => handleRemoveExtra(i)}>
                        <X className="w-4 h-4 text-gray-400 hover:text-coral-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={extraName}
                onChange={(e) => setExtraName(e.target.value)}
                placeholder="费用名称"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-coral-400"
              />
              <input
                value={extraAmount}
                onChange={(e) => setExtraAmount(e.target.value)}
                placeholder="金额"
                type="number"
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-coral-400"
              />
              <button
                onClick={handleAddExtra}
                className="px-3 py-2 bg-coral-400/10 text-coral-400 rounded-lg hover:bg-coral-400/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="font-bold text-gray-800">合计</span>
            <span className="text-2xl font-extrabold text-coral-400">¥{total}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={handleCheckout}
          className="w-full py-3.5 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors"
        >
          确认接回
        </button>
      </div>

      <AnimatePresence>
        {showModal && billData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowModal(false)
              navigate("/staff")
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-16 h-16 bg-mint-400 rounded-full flex items-center justify-center mb-4"
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-lg font-display font-bold text-gray-800 mb-1">退房成功</h3>
                <p className="text-sm text-gray-500 mb-4">{pet?.name} 已完成离店结算</p>

                <div className="w-full bg-cream-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-4 h-4 text-coral-400" />
                    <span className="font-semibold text-sm text-gray-800">账单摘要</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">住宿 {billData.days} 天</span>
                      <span className="text-gray-700">¥{billData.subtotal}</span>
                    </div>
                    {extras.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">额外费用</span>
                        <span className="text-gray-700">¥{billData.extrasTotal}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-800">合计</span>
                      <span className="font-extrabold text-coral-400">¥{billData.total}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false)
                    navigate("/staff")
                  }}
                  className="w-full mt-5 py-3 bg-coral-400 text-white font-bold rounded-xl hover:bg-coral-500 transition-colors"
                >
                  返回工作站
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
