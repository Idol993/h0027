import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Calendar, PawPrint, Home, AlertTriangle, FileText, X, Eye, MessageSquare, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { differenceInCalendarDays, parseISO, isAfter, isBefore, addDays, format } from "date-fns"
import { useStore } from "@/store"
import StatusBadge from "@/components/StatusBadge"
import StarRating from "@/components/StarRating"
import Empty from "@/components/Empty"

const spiritLabels: Record<string, string> = {
  energetic: "精力旺盛",
  calm: "安静平和",
  lethargic: "精神不振",
  anxious: "焦虑不安",
}
const dietLabels: Record<string, string> = { normal: "正常", reduced: "减少", refusing: "拒食" }
const incidentLabels: Record<string, string> = {
  vomiting: "呕吐",
  refusing_food: "拒食",
  injury: "受伤",
  other: "其他",
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const bookings = useStore((s) => s.bookings)
  const cages = useStore((s) => s.cages)
  const pets = useStore((s) => s.pets)
  const users = useStore((s) => s.users)
  const diaries = useStore((s) => s.diaries)
  const incidents = useStore((s) => s.incidents)
  const viewIncident = useStore((s) => s.viewIncident)
  const submitReview = useStore((s) => s.submitReview)
  const cancelBooking = useStore((s) => s.cancelBooking)
  const calculateRefund = useStore((s) => s.calculateRefund)

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState("")
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  const booking = useMemo(() => {
    return id ? bookings.find((b) => b.id === id) : undefined
  }, [id, bookings])

  const refundInfo = useMemo(() => {
    if (!id) return null
    return calculateRefund(id)
  }, [id, calculateRefund])

  const cage = useMemo(() => {
    return booking ? cages.find((c) => c.id === booking.cageId) : undefined
  }, [booking, cages])

  const pet = useMemo(() => {
    return booking ? pets.find((p) => p.id === booking.petId) : undefined
  }, [booking, pets])

  const bookingDiaries = useMemo(() => {
    if (!booking) return []
    return diaries
      .filter((d) => d.bookingId === booking.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [booking, diaries])

  const bookingIncidents = useMemo(() => {
    if (!booking) return []
    return incidents.filter((i) => i.bookingId === booking.id)
  }, [booking, incidents])

  const days = useMemo(() => {
    if (!booking) return 0
    return differenceInCalendarDays(parseISO(booking.endDate), parseISO(booking.startDate))
  }, [booking])

  const reviewStatus = useMemo(() => {
    if (!booking || booking.status !== "checked_out" || !booking.actualEndDate) {
      return "none" as const
    }
    if (booking.review) return "exists" as const
    const checkoutTime = parseISO(booking.actualEndDate).getTime()
    const hoursDiff = (Date.now() - checkoutTime) / (1000 * 60 * 60)
    if (hoursDiff > 72) return "expired" as const
    return "available" as const
  }, [booking])

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Empty message="预约不存在" />
      </div>
    )
  }

  function handleReviewSubmit() {
    if (!id || !reviewContent.trim()) return
    const ok = submitReview(id, reviewRating, reviewContent.trim())
    if (ok) {
      setReviewSubmitted(true)
    }
  }

  function handleCancel() {
    if (!id) return
    const result = cancelBooking(id)
    if (result.success) {
      setShowCancelModal(false)
    }
  }

  function handleViewIncident(incidentId: string) {
    viewIncident(incidentId)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-4xl shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-gray-800">预约详情</h2>
          <StatusBadge status={booking.status} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-coral-400" />
            <span>{booking.startDate} ~ {booking.endDate}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Home className="w-4 h-4 text-coral-400" />
            <span>{cage?.name ?? "-"}（{cage?.size === "small" ? "小型" : cage?.size === "medium" ? "中型" : "大型"}）</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <PawPrint className="w-4 h-4 text-coral-400" />
            <span>{pet?.name ?? "-"}</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-coral-400">¥{booking.dailyRate}/天</span>
            <span className="text-gray-400 ml-1">× {days}天</span>
          </div>
        </div>
      </motion.div>

      {pet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          <h3 className="text-sm font-display font-bold text-gray-800 mb-3">宠物信息</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
            <p><span className="text-gray-400">名称：</span>{pet.name}</p>
            <p><span className="text-gray-400">类型：</span>{pet.type === "dog" ? "犬" : pet.type === "cat" ? "猫" : "其他"}</p>
            <p><span className="text-gray-400">品种：</span>{pet.breed}</p>
            <p><span className="text-gray-400">年龄：</span>{pet.age}岁</p>
            <p><span className="text-gray-400">体重：</span>{pet.weight}kg</p>
            <p>
              <span className="text-gray-400">疫苗：</span>
              <span className={pet.vaccinated ? "text-mint-500" : "text-coral-500"}>
                {pet.vaccinated ? "已接种" : "未接种"}
              </span>
            </p>
            {pet.specialNeeds && (
              <p className="col-span-2"><span className="text-gray-400">特殊需求：</span>{pet.specialNeeds}</p>
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white rounded-4xl shadow-card p-6"
      >
        <h3 className="text-sm font-display font-bold text-gray-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-coral-400" />
          支付状态
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">订单总额</span>
            <span className="font-bold text-gray-800">¥{booking.totalAmount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">订金（30%）</span>
            <span className="font-bold text-mint-500">¥{booking.depositAmount}
              {booking.payments?.some((p) => p.type === "deposit") && (
                <span className="text-[10px] px-1.5 py-0.5 ml-1.5 rounded bg-mint-100 text-mint-600 align-middle">已支付</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">尾款（入住时支付）</span>
            <span className="font-bold text-gray-700">¥{booking.balanceAmount}
              {booking.payments?.some((p) => p.type === "balance") && (
                <span className="text-[10px] px-1.5 py-0.5 ml-1.5 rounded bg-mint-100 text-mint-600 align-middle">已支付</span>
              )}
            </span>
          </div>
        </div>
        {booking.payments && booking.payments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">支付记录</p>
            <div className="space-y-2">
              {booking.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs bg-cream-100 rounded-xl px-3 py-2">
                  <span className="text-gray-600">
                    {p.type === "deposit" ? "订金" : "尾款"}
                    <span className="text-gray-400 ml-2">{format(parseISO(p.paidAt), "MM-dd HH:mm")}</span>
                  </span>
                  <span className="font-bold text-mint-500">+¥{p.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {booking.checkinRecord && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          <h3 className="text-sm font-display font-bold text-gray-800 mb-3">入住记录</h3>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-cream-100 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">精神状态</p>
              <p className="font-semibold text-gray-700">{spiritLabels[booking.checkinRecord.spirit]}</p>
            </div>
            <div className="bg-cream-100 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">饮食情况</p>
              <p className="font-semibold text-gray-700">{dietLabels[booking.checkinRecord.diet]}</p>
            </div>
            <div className="bg-cream-100 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">用药需求</p>
              <p className="font-semibold text-gray-700">
                {booking.checkinRecord.medicationNeeded ? "需要" : "无"}
              </p>
            </div>
          </div>
          {booking.checkinRecord.medicationDetail && (
            <p className="text-xs text-gray-500 mt-2">
              用药详情：{booking.checkinRecord.medicationDetail}
            </p>
          )}
        </motion.div>
      )}

      {bookingDiaries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          <h3 className="text-sm font-display font-bold text-gray-800 mb-4">看护日记</h3>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-cream-300" />
            {bookingDiaries.map((diary, idx) => {
              const author = users.find((u) => u.id === diary.createdBy)
              const isLeft = idx % 2 === 0
              return (
                <motion.div
                  key={diary.id}
                  initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative"
                >
                  <div className="absolute left-[-18px] top-2 w-3 h-3 rounded-full bg-coral-400 border-2 border-white" />
                  <div className="bg-cream-100 rounded-2xl p-4">
                    <p className="text-xs text-gray-400 mb-1">
                      {format(parseISO(diary.createdAt), "yyyy-MM-dd HH:mm")}
                    </p>
                    <p className="text-sm text-gray-700">{diary.content}</p>
                    {diary.images.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {diary.images.map((img, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={img}
                            alt=""
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">— {author?.name ?? "未知"}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {bookingIncidents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          <h3 className="text-sm font-display font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-coral-400" />
            异常事件
          </h3>
          <div className="space-y-3">
            {bookingIncidents.map((incident) => (
              <div
                key={incident.id}
                className="border-2 border-coral-200 rounded-2xl p-4 bg-coral-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-coral-600">
                    {incidentLabels[incident.type]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(parseISO(incident.createdAt), "yyyy-MM-dd HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{incident.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    通知状态：{incident.notifyStatus === "sent" ? "已发送" : incident.notifyStatus === "viewed" ? "已查看" : incident.notifyStatus === "reminded" ? "已提醒" : "已升级"}
                  </span>
                  {incident.notifyStatus !== "viewed" && (
                    <button
                      onClick={() => handleViewIncident(incident.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-coral-400 text-white text-xs font-semibold rounded-xl hover:bg-coral-500 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      标记已查看
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {(reviewStatus === "available" || reviewStatus === "exists" || reviewStatus === "expired") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          <h3 className="text-sm font-display font-bold text-gray-800 mb-4">评价</h3>
          {reviewStatus === "exists" && (
            <div className="bg-cream-100 rounded-2xl p-4">
              <StarRating rating={booking.review!.rating} size="md" />
              <p className="text-sm text-gray-700 mt-2">{booking.review!.content}</p>
              <p className="text-xs text-gray-400 mt-2">{booking.review!.createdAt}</p>
            </div>
          )}
          {reviewStatus === "available" && !reviewSubmitted && (
            <div className="space-y-4">
              <StarRating rating={reviewRating} onChange={setReviewRating} size="lg" />
              <textarea
                placeholder="分享您的寄养体验..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm resize-none"
                rows={3}
              />
              <button
                onClick={handleReviewSubmit}
                disabled={!reviewContent.trim()}
                className="w-full py-3 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors disabled:opacity-40"
              >
                提交评价
              </button>
            </div>
          )}
          {reviewStatus === "available" && reviewSubmitted && (
            <div className="bg-mint-50 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-mint-600">评价已提交，感谢您的反馈！</p>
            </div>
          )}
          {reviewStatus === "expired" && (
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-sm text-gray-400">评价已过期（离店超过72小时）</p>
            </div>
          )}
        </motion.div>
      )}

      {booking.status === "confirmed" && (
        <div className="pb-4">
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3 border-2 border-coral-400 text-coral-400 font-bold rounded-2xl hover:bg-coral-50 transition-colors"
          >
            取消预约
          </button>
        </div>
      )}

      {booking.status === "cancelled" && booking.cancelledAt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-4xl shadow-card p-6 border-2 border-gray-200"
        >
          <h3 className="text-sm font-display font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500" />
            取消信息
          </h3>
          <p className="text-sm text-gray-600">
            取消时间：{format(parseISO(booking.cancelledAt), "yyyy-MM-dd HH:mm")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {booking.cancellationNote}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            笼位已释放，可重新预约
          </p>
        </motion.div>
      )}

      {booking.refunds && booking.refunds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="bg-coral-50 rounded-4xl shadow-card p-6 border-2 border-coral-200"
        >
          <h3 className="text-sm font-display font-bold text-coral-700 mb-3">退款记录</h3>
          {booking.refunds.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  {r.reason === "cancellation" ? "取消退款" : "退款"}
                </span>
                <span className="text-lg font-extrabold text-coral-500">-¥{r.amount}</span>
              </div>
              <p className="text-xs text-gray-500">
                距离入住 {r.daysBeforeCheckin} 天
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {format(parseISO(r.refundedAt), "yyyy-MM-dd HH:mm")}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {booking.smsRecords && booking.smsRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          <h3 className="text-sm font-display font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-mint-500" />
            通知记录
          </h3>
          <div className="space-y-3">
            {booking.smsRecords.map((sms, idx) => (
              <motion.div
                key={sms.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-cream-100 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">{sms.recipient}</span>
                    <span className="text-xs text-gray-400">{sms.recipientPhone}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-mint-400/20 text-mint-600 font-semibold">
                    已发送
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{sms.content}</p>
                <p className="text-[10px] text-gray-400 mt-2">
                  {format(parseISO(sms.sentAt), "yyyy-MM-dd HH:mm:ss")}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {showCancelModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-4xl shadow-card-hover p-6 max-w-sm w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-display font-bold text-gray-800">确认取消</h3>
                <button onClick={() => setShowCancelModal(false)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">确定要取消此预约吗？此操作不可撤销。</p>
              {refundInfo && (
                <div className="bg-amber-50 rounded-2xl p-4 mb-6">
                  <p className="text-xs font-bold text-amber-700 mb-2">退款说明</p>
                  <p className="text-sm text-gray-700">
                    距离入住 <span className="font-bold text-amber-600">{refundInfo.daysBeforeCheckin}</span> 天
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    可退比例：<span className="font-bold text-amber-600">{Math.round(refundInfo.rate * 100)}%</span>
                  </p>
                  <p className="text-lg font-extrabold text-coral-500 mt-2">
                    预计退还：¥{refundInfo.refundAmount}
                  </p>
                  {refundInfo.refundAmount === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      距离入住不足3天，订金不予退还
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-2xl hover:bg-gray-200 transition-colors text-sm"
                >
                  再想想
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2.5 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors text-sm"
                >
                  确认取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
