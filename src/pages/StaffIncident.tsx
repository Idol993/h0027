import { useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { ChevronRight, Droplet, UtensilsCrossed, Bandage, AlertCircle, Camera, X, Info } from "lucide-react"
import { format, parseISO, differenceInHours } from "date-fns"
import { useStore } from "@/store"
import type { IncidentType, NotifyStatus } from "@/types"

const typeOptions: { value: IncidentType; label: string; icon: typeof Droplet; color: string; bg: string }[] = [
  { value: "vomiting", label: "呕吐", icon: Droplet, color: "text-blue-500", bg: "bg-blue-50" },
  { value: "refusing_food", label: "拒食", icon: UtensilsCrossed, color: "text-amber-500", bg: "bg-amber-50" },
  { value: "injury", label: "受伤", icon: Bandage, color: "text-red-500", bg: "bg-red-50" },
  { value: "other", label: "其他", icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-100" },
]

const notifyBadge: Record<NotifyStatus, { label: string; color: string }> = {
  sent: { label: "已推送", color: "bg-blue-50 text-blue-500" },
  viewed: { label: "已查看", color: "bg-mint-400/10 text-mint-400" },
  reminded: { label: "已催促", color: "bg-amber-50 text-amber-600" },
  escalated: { label: "已通知管理员", color: "bg-red-50 text-red-500" },
}

export default function StaffIncident() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const bookings = useStore((s) => s.bookings)
  const pets = useStore((s) => s.pets)
  const cages = useStore((s) => s.cages)
  const incidents = useStore((s) => s.incidents)
  const users = useStore((s) => s.users)
  const currentUser = useStore((s) => s.currentUser)
  const addIncident = useStore((s) => s.addIncident)
  const viewIncident = useStore((s) => s.viewIncident)
  const remindIncident = useStore((s) => s.remindIncident)
  const escalateIncident = useStore((s) => s.escalateIncident)

  const [type, setType] = useState<IncidentType>("vomiting")
  const [description, setDescription] = useState("")
  const [photos, setPhotos] = useState<string[]>([])

  const booking = bookings.find((b) => b.id === bookingId)
  const pet = booking ? pets.find((p) => p.id === booking.petId) : null
  const cage = booking ? cages.find((c) => c.id === booking.cageId) : null

  const bookingIncidents = useMemo(
    () =>
      incidents
        .filter((i) => i.bookingId === bookingId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [incidents, bookingId]
  )

  if (!booking) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <p className="text-gray-500">预约不存在</p>
      </div>
    )
  }

  const handleAddPhoto = () => {
    setPhotos((prev) => [
      ...prev,
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20incident%20photo%20${Date.now()}&image_size=landscape_4_3`,
    ])
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!description.trim()) return
    addIncident(booking.id, type, description, photos, currentUser?.id ?? "")
    setType("vomiting")
    setDescription("")
    setPhotos([])
  }

  const canRemind = (incident: typeof bookingIncidents[0]) => {
    if (incident.notifyStatus !== "sent") return false
    return differenceInHours(new Date(), parseISO(incident.createdAt)) > 24
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate("/staff")} className="text-gray-600">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="font-display font-bold text-gray-800">异常记录</h1>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800">{pet?.name ?? "-"}</p>
            <p className="text-xs text-gray-500">笼位: {cage?.name ?? "-"}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold text-gray-800 mb-3">异常类型</h2>
          <div className="grid grid-cols-2 gap-3">
            {typeOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    type === opt.value
                      ? `${opt.bg} ring-2 ring-offset-2 ring-coral-400`
                      : "bg-gray-50"
                  }`}
                >
                  <Icon className={`w-8 h-8 ${opt.color}`} />
                  <span className="text-sm font-semibold text-gray-700">{opt.label}</span>
                </button>
              )
            })}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述异常情况..."
            className="w-full mt-4 p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-coral-400"
            rows={3}
          />

          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-coral-400 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddPhoto}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-coral-400 hover:text-coral-400 transition-colors"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] mt-0.5">上传照片</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="w-full mt-4 py-3 bg-coral-400 text-white font-bold rounded-xl hover:bg-coral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交异常记录
          </button>
        </div>
      </div>

      <div className="px-4 pt-6">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-3">异常记录</h2>
        {bookingIncidents.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">暂无异常记录</div>
        ) : (
          <div className="space-y-3">
            {bookingIncidents.map((incident, idx) => {
              const badge = notifyBadge[incident.notifyStatus]
              const author = users.find((u) => u.id === incident.createdBy)
              return (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-card p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {typeOptions.find((t) => t.value === incident.type)?.label ?? "其他"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(parseISO(incident.createdAt), "MM-dd HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{incident.description}</p>
                  {incident.photos.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {incident.photos.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">记录人: {author?.name ?? "养护员"}</p>
                  <div className="flex gap-2 mt-3">
                    {incident.notifyStatus === "sent" && (
                      <button
                        onClick={() => viewIncident(incident.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                      >
                        标记已查看
                      </button>
                    )}
                    {canRemind(incident) && (
                      <button
                        onClick={() => remindIncident(incident.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        催促主人
                      </button>
                    )}
                    {incident.notifyStatus === "reminded" && (
                      <button
                        onClick={() => escalateIncident(incident.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        通知管理员
                      </button>
                    )}
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
