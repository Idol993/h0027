import { useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { ChevronRight, Camera, X, Image as ImageIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useStore } from "@/store"
import Empty from "@/components/Empty"

export default function StaffDiary() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const bookings = useStore((s) => s.bookings)
  const pets = useStore((s) => s.pets)
  const cages = useStore((s) => s.cages)
  const diaries = useStore((s) => s.diaries)
  const users = useStore((s) => s.users)
  const currentUser = useStore((s) => s.currentUser)
  const addCareDiary = useStore((s) => s.addCareDiary)

  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [toast, setToast] = useState("")

  const booking = bookings.find((b) => b.id === bookingId)
  const pet = booking ? pets.find((p) => p.id === booking.petId) : null
  const cage = booking ? cages.find((c) => c.id === booking.cageId) : null

  const bookingDiaries = useMemo(
    () =>
      diaries
        .filter((d) => d.bookingId === bookingId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [diaries, bookingId]
  )

  if (!booking) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <p className="text-gray-500">预约不存在</p>
      </div>
    )
  }

  const handleAddImage = () => {
    if (images.length >= 4) return
    setImages((prev) => [
      ...prev,
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20diary%20photo%20${Date.now()}&image_size=landscape_4_3`,
    ])
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!content.trim()) return
    const result = addCareDiary(booking.id, content, images, currentUser?.id ?? "")
    if (!result) {
      setToast("今日看护日记已达上限（2条）")
      setTimeout(() => setToast(""), 3000)
      return
    }
    setContent("")
    setImages([])
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      <div className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate("/staff")} className="text-gray-600">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="font-display font-bold text-gray-800">看护日记</h1>
      </div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-3 py-3 px-4 bg-red-50 text-red-500 text-sm rounded-xl text-center font-semibold"
        >
          {toast}
        </motion.div>
      )}

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint-400/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-mint-400" />
          </div>
          <div>
            <p className="font-bold text-gray-800">{pet?.name ?? "-"}</p>
            <p className="text-xs text-gray-500">笼位: {cage?.name ?? "-"}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 500))}
            placeholder="记录今天的看护情况..."
            className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-coral-400"
            rows={4}
          />
          <div className="flex justify-end">
            <span className="text-xs text-gray-400">{content.length}/500</span>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-coral-400 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  onClick={handleAddImage}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-coral-400 hover:text-coral-400 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[10px] mt-0.5">{images.length}/4</span>
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="w-full mt-4 py-3 bg-coral-400 text-white font-bold rounded-xl hover:bg-coral-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交日记
          </button>
        </div>
      </div>

      <div className="px-4 pt-6">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-3">历史日记</h2>
        {bookingDiaries.length === 0 ? (
          <Empty message="暂无看护日记" />
        ) : (
          <div className="space-y-3">
            {bookingDiaries.map((diary, idx) => {
              const author = users.find((u) => u.id === diary.createdBy)
              return (
                <motion.div
                  key={diary.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl shadow-card p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">
                      {format(parseISO(diary.createdAt), "yyyy-MM-dd HH:mm")}
                    </span>
                    <span className="text-xs text-mint-400 font-semibold">{author?.name ?? "养护员"}</span>
                  </div>
                  <p className="text-sm text-gray-700">{diary.content}</p>
                  {diary.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {diary.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-20 h-20 rounded-xl object-cover" />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
