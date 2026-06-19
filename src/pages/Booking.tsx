import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, PawPrint, Home, Check, Plus, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { differenceInCalendarDays, addDays, format, parseISO } from "date-fns"
import { useStore } from "@/store"
import CageGrid from "@/components/CageGrid"
import type { Pet, Cage } from "@/types"

const stepLabels = ["选择日期", "选择宠物", "选择笼位", "确认预约"]
const stepIcons = [Calendar, PawPrint, Home, Check]

export default function Booking() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const cages = useStore((s) => s.cages)
  const getPetsByOwner = useStore((s) => s.getPetsByOwner)
  const getAvailableCages = useStore((s) => s.getAvailableCages)
  const getAlternativeDates = useStore((s) => s.getAlternativeDates)
  const createBooking = useStore((s) => s.createBooking)

  const [step, setStep] = useState(0)
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd"))
  const [selectedPetId, setSelectedPetId] = useState("")
  const [selectedCageId, setSelectedCageId] = useState("")
  const [showNewPet, setShowNewPet] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingId, setBookingId] = useState("")

  const [newPet, setNewPet] = useState({
    name: "",
    type: "dog" as Pet["type"],
    breed: "",
    age: 0,
    weight: 0,
    vaccinated: false,
    specialNeeds: "",
  })

  const ownerPets = useMemo(() => {
    if (!currentUser) return []
    return getPetsByOwner(currentUser.id)
  }, [currentUser, getPetsByOwner])

  const days = useMemo(() => {
    try {
      return differenceInCalendarDays(parseISO(endDate), parseISO(startDate))
    } catch {
      return 0
    }
  }, [startDate, endDate])

  const availableCages = useMemo(() => {
    if (!startDate || !endDate || days <= 0) return []
    return getAvailableCages(startDate, endDate)
  }, [startDate, endDate, days, getAvailableCages])

  const alternatives = useMemo(() => {
    if (availableCages.length > 0 || !startDate || !endDate) return []
    return getAlternativeDates(startDate, endDate)
  }, [availableCages, startDate, endDate, getAlternativeDates])

  const occupiedIds = useMemo(() => {
    return cages.filter((c) => !availableCages.some((ac) => ac.id === c.id)).map((c) => c.id)
  }, [cages, availableCages])

  const selectedCage = useMemo(() => {
    return cages.find((c) => c.id === selectedCageId)
  }, [cages, selectedCageId])

  const selectedPet = useMemo(() => {
    return ownerPets.find((p) => p.id === selectedPetId)
  }, [ownerPets, selectedPetId])

  const totalPrice = useMemo(() => {
    if (!selectedCage || days <= 0) return 0
    return days * selectedCage.dailyRate
  }, [selectedCage, days])

  function handleSelectAlt(alt: { startDate: string; endDate: string }) {
    setStartDate(alt.startDate)
    setEndDate(alt.endDate)
  }

  function handleAddPet() {
    if (!newPet.name || !newPet.breed) return
    const pet: Pet = {
      id: Date.now().toString(36),
      ownerId: currentUser!.id,
      ...newPet,
    }
    useStore.setState((s) => ({ pets: [...s.pets, pet] }))
    setSelectedPetId(pet.id)
    setShowNewPet(false)
    setNewPet({ name: "", type: "dog", breed: "", age: 0, weight: 0, vaccinated: false, specialNeeds: "" })
  }

  function handleConfirm() {
    if (!currentUser || !selectedPetId || !selectedCageId || days <= 0) return
    const booking = createBooking({
      ownerId: currentUser.id,
      petId: selectedPetId,
      cageId: selectedCageId,
      startDate,
      endDate,
      dailyRate: selectedCage!.dailyRate,
    })
    setBookingId(booking.id)
    setShowSuccess(true)
  }

  function canProceed() {
    switch (step) {
      case 0:
        return startDate && endDate && days > 0
      case 1:
        return !!selectedPetId
      case 2:
        return !!selectedCageId
      case 3:
        return true
      default:
        return false
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        {stepLabels.map((label, idx) => {
          const Icon = stepIcons[idx]
          const active = idx === step
          const done = idx < step
          return (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  active
                    ? "bg-coral-400 text-white"
                    : done
                      ? "bg-mint-400 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[10px] font-semibold ${active ? "text-coral-400" : "text-gray-400"}`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-display font-bold text-gray-800">选择日期</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">入住日期</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">离店日期</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-cream-300 focus:border-coral-400 focus:ring-2 focus:ring-coral-100 outline-none text-sm"
                  />
                </div>
              </div>
              {days > 0 && (
                <p className="text-sm text-gray-500">
                  共 <span className="font-bold text-coral-400">{days}</span> 天
                </p>
              )}
              {startDate && endDate && days > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">可用笼位</h3>
                  <CageGrid
                    cages={cages}
                    occupiedIds={occupiedIds}
                  />
                </div>
              )}
              {availableCages.length === 0 && startDate && endDate && days > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-coral-500 font-semibold">所选日期无可用笼位</p>
                  <p className="text-xs text-gray-500">推荐以下替代日期：</p>
                  {alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-cream-100 rounded-2xl p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {alt.startDate} ~ {alt.endDate}
                        </p>
                        <p className="text-xs text-gray-500">
                          可用笼位 {alt.availableCages.length} 个
                        </p>
                      </div>
                      <button
                        onClick={() => handleSelectAlt(alt)}
                        className="px-4 py-1.5 bg-coral-400 text-white text-xs font-bold rounded-xl hover:bg-coral-500 transition-colors"
                      >
                        选择此日期
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-display font-bold text-gray-800">选择宠物</h2>
              <div className="grid grid-cols-2 gap-3">
                {ownerPets.map((pet) => (
                  <motion.button
                    key={pet.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`p-4 rounded-2xl text-left transition-colors ${
                      selectedPetId === pet.id
                        ? "bg-coral-50 border-2 border-coral-400"
                        : "bg-cream-100 border-2 border-transparent hover:bg-cream-200"
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-800">{pet.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {pet.type === "dog" ? "犬" : pet.type === "cat" ? "猫" : "其他"} · {pet.breed}
                    </p>
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewPet(true)}
                  className="p-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-coral-400 hover:text-coral-400 transition-colors flex flex-col items-center justify-center gap-1"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-semibold">添加新宠物</span>
                </motion.button>
              </div>

              <AnimatePresence>
                {showNewPet && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-cream-100 rounded-2xl p-4 space-y-3 relative">
                      <button
                        onClick={() => setShowNewPet(false)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-coral-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <h3 className="text-sm font-bold text-gray-700">添加新宠物</h3>
                      <input
                        placeholder="宠物名称"
                        value={newPet.name}
                        onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-cream-300 text-sm outline-none focus:border-coral-400"
                      />
                      <select
                        value={newPet.type}
                        onChange={(e) => setNewPet({ ...newPet, type: e.target.value as Pet["type"] })}
                        className="w-full px-3 py-2 rounded-xl border border-cream-300 text-sm outline-none focus:border-coral-400"
                      >
                        <option value="dog">犬</option>
                        <option value="cat">猫</option>
                        <option value="other">其他</option>
                      </select>
                      <input
                        placeholder="品种"
                        value={newPet.breed}
                        onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-cream-300 text-sm outline-none focus:border-coral-400"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="年龄"
                          value={newPet.age || ""}
                          onChange={(e) => setNewPet({ ...newPet, age: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-cream-300 text-sm outline-none focus:border-coral-400"
                        />
                        <input
                          type="number"
                          placeholder="体重(kg)"
                          value={newPet.weight || ""}
                          onChange={(e) => setNewPet({ ...newPet, weight: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-cream-300 text-sm outline-none focus:border-coral-400"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPet.vaccinated}
                          onChange={(e) => setNewPet({ ...newPet, vaccinated: e.target.checked })}
                          className="accent-coral-400"
                        />
                        已接种疫苗
                      </label>
                      <textarea
                        placeholder="特殊需求（选填）"
                        value={newPet.specialNeeds}
                        onChange={(e) => setNewPet({ ...newPet, specialNeeds: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-cream-300 text-sm outline-none focus:border-coral-400 resize-none"
                        rows={2}
                      />
                      <button
                        onClick={handleAddPet}
                        className="w-full py-2 bg-coral-400 text-white text-sm font-bold rounded-xl hover:bg-coral-500 transition-colors"
                      >
                        添加宠物
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-display font-bold text-gray-800">选择笼位</h2>
              <CageGrid
                cages={cages}
                occupiedIds={occupiedIds}
                onSelect={(cage: Cage) => setSelectedCageId(cage.id)}
                selectedId={selectedCageId}
              />
              {selectedCage && (
                <div className="bg-cream-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{selectedCage.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedCage.size === "small" ? "小型" : selectedCage.size === "medium" ? "中型" : "大型"}笼位
                    </p>
                  </div>
                  <p className="text-sm font-bold text-coral-400">¥{selectedCage.dailyRate}/天</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-display font-bold text-gray-800">确认预约</h2>
              <div className="space-y-3">
                <div className="bg-cream-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">日期</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {startDate} ~ {endDate}（{days}天）
                  </p>
                </div>
                <div className="bg-cream-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">宠物</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedPet?.name ?? "-"} · {selectedPet?.breed ?? "-"}
                  </p>
                </div>
                <div className="bg-cream-100 rounded-2xl p-4">
                  <p className="text-xs text-gray-500 mb-1">笼位</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedCage?.name ?? "-"} ·
                    {selectedCage?.size === "small" ? "小型" : selectedCage?.size === "medium" ? "中型" : "大型"}
                  </p>
                </div>
                <div className="bg-coral-50 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">费用合计</p>
                    <p className="text-xs text-gray-400">
                      {days}天 × ¥{selectedCage?.dailyRate ?? 0}/天
                    </p>
                  </div>
                  <p className="text-2xl font-extrabold text-coral-400">¥{totalPrice}</p>
                </div>
              </div>
              <button
                onClick={handleConfirm}
                className="w-full py-3.5 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors shadow-glow"
              >
                确认预约
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 3 && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-6 py-2.5 rounded-2xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            上一步
          </button>
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-coral-400 hover:bg-coral-500 transition-colors shadow-glow disabled:opacity-40"
          >
            下一步
          </button>
        </div>
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowSuccess(false)
              navigate("/my-bookings")
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-4xl shadow-card-hover p-8 text-center max-w-sm w-full"
            >
              <div className="w-16 h-16 bg-mint-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-display font-bold text-gray-800 mb-2">预约成功！</h3>
              <p className="text-sm text-gray-500 mb-1">预约编号：{bookingId}</p>
              <p className="text-xs text-gray-400 mb-6">请在预约详情中查看更多信息</p>
              <button
                onClick={() => {
                  setShowSuccess(false)
                  navigate("/my-bookings")
                }}
                className="w-full py-3 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors"
              >
                查看我的预约
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
