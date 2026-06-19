import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Bed, TrendingDown, AlertTriangle, Camera, Check, ChevronRight } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useStore } from "@/store"
import type { PetSpirit, PetDiet } from "@/types"

const spiritOptions: { value: PetSpirit; label: string; sub: string; icon: typeof Zap; color: string }[] = [
  { value: "energetic", label: "活力充沛", sub: "跳", icon: Zap, color: "bg-mint-400 text-white" },
  { value: "calm", label: "安静平稳", sub: "睡", icon: Bed, color: "bg-blue-400 text-white" },
  { value: "lethargic", label: "精神萎靡", sub: "趴", icon: TrendingDown, color: "bg-amber-500 text-white" },
  { value: "anxious", label: "紧张不安", sub: "抖", icon: AlertTriangle, color: "bg-coral-400 text-white" },
]

const dietOptions: { value: PetDiet; label: string }[] = [
  { value: "normal", label: "正常进食" },
  { value: "reduced", label: "食欲减退" },
  { value: "refusing", label: "拒食" },
]

export default function StaffCheckin() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const bookings = useStore((s) => s.bookings)
  const pets = useStore((s) => s.pets)
  const users = useStore((s) => s.users)
  const cages = useStore((s) => s.cages)
  const currentUser = useStore((s) => s.currentUser)
  const checkInBooking = useStore((s) => s.checkInBooking)

  const [step, setStep] = useState(0)
  const [spirit, setSpirit] = useState<PetSpirit>("energetic")
  const [diet, setDiet] = useState<PetDiet>("normal")
  const [medicationNeeded, setMedicationNeeded] = useState(false)
  const [medicationDetail, setMedicationDetail] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const booking = bookings.find((b) => b.id === bookingId)
  const pet = booking ? pets.find((p) => p.id === booking.petId) : null
  const owner = booking ? users.find((u) => u.id === booking.ownerId) : null
  const cage = booking ? cages.find((c) => c.id === booking.cageId) : null

  if (!booking) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <p className="text-gray-500">预约不存在</p>
      </div>
    )
  }

  const handleSimulateUpload = () => {
    setPhotos((prev) => [...prev, "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20checkin%20photo&image_size=square"])
  }

  const handleSubmit = () => {
    checkInBooking(booking.id, {
      spirit,
      diet,
      medicationNeeded,
      medicationDetail: medicationNeeded ? medicationDetail : undefined,
      photos,
      checkedInAt: new Date().toISOString(),
      checkedInBy: currentUser?.id ?? "",
    })
    setSubmitted(true)
    setTimeout(() => navigate("/staff"), 1500)
  }

  const steps = ["核实信息", "记录状态", "确认核销"]
  const progress = ((step + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-cream-100">
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/staff")} className="text-gray-600">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="font-display font-bold text-gray-800">扫码核销</h1>
      </div>

      <div className="px-4 pt-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-coral-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {steps.map((s, i) => (
            <span key={s} className={i <= step ? "text-coral-400 font-semibold" : ""}>{s}</span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 bg-mint-400 rounded-full flex items-center justify-center mb-4"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <p className="text-xl font-display font-bold text-gray-800">核销成功</p>
            <p className="text-sm text-gray-500 mt-1">即将返回工作站...</p>
          </motion.div>
        ) : step === 0 ? (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="px-4 pt-6"
          >
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-bold text-gray-800 mb-4">预约信息</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">宠物名称</span>
                  <span className="font-semibold text-gray-800">{pet?.name ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">主人姓名</span>
                  <span className="font-semibold text-gray-800">{owner?.name ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">入住日期</span>
                  <span className="font-semibold text-gray-800">{format(parseISO(booking.startDate), "yyyy-MM-dd")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">离店日期</span>
                  <span className="font-semibold text-gray-800">{format(parseISO(booking.endDate), "yyyy-MM-dd")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">笼位</span>
                  <span className="font-semibold text-gray-800">{cage?.name ?? "-"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full mt-6 py-3.5 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors"
            >
              信息确认，下一步
            </button>
          </motion.div>
        ) : step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="px-4 pt-6 space-y-5"
          >
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-bold text-gray-800 mb-3">精神状态</h2>
              <div className="grid grid-cols-4 gap-2">
                {spiritOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSpirit(opt.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                        spirit === opt.value
                          ? `${opt.color} ring-2 ring-offset-2 ring-coral-400`
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] opacity-70">{opt.sub}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-bold text-gray-800 mb-3">饮食状态</h2>
              <div className="flex gap-2">
                {dietOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDiet(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      diet === opt.value
                        ? "bg-coral-400 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800">是否需要用药</h2>
                <button
                  onClick={() => setMedicationNeeded(!medicationNeeded)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    medicationNeeded ? "bg-coral-400" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      medicationNeeded ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              {medicationNeeded && (
                <motion.textarea
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  value={medicationDetail}
                  onChange={(e) => setMedicationDetail(e.target.value)}
                  placeholder="请描述用药详情..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-coral-400"
                  rows={3}
                />
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-bold text-gray-800 mb-3">拍照记录</h2>
              <div className="flex flex-wrap gap-2">
                {photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                ))}
                <button
                  onClick={handleSimulateUpload}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-coral-400 hover:text-coral-400 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] mt-0.5">模拟上传</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors"
            >
              下一步
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="px-4 pt-6"
          >
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-bold text-gray-800 mb-4">确认核销信息</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">宠物</span>
                  <span className="font-semibold text-gray-800">{pet?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">精神状态</span>
                  <span className="font-semibold text-gray-800">{spiritOptions.find((s) => s.value === spirit)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">饮食状态</span>
                  <span className="font-semibold text-gray-800">{dietOptions.find((d) => d.value === diet)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">需要用药</span>
                  <span className="font-semibold text-gray-800">{medicationNeeded ? "是" : "否"}</span>
                </div>
                {medicationNeeded && medicationDetail && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">用药详情</span>
                    <span className="font-semibold text-gray-800 text-right max-w-[60%]">{medicationDetail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">照片</span>
                  <span className="font-semibold text-gray-800">{photos.length}张</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full mt-6 py-3.5 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors"
            >
              确认核销
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
