import { useMemo, useRef } from "react"
import { Link } from "react-router-dom"
import { MapPin, Clock, PawPrint, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useStore } from "@/store"
import StarRating from "@/components/StarRating"

const sizeLabels: Record<string, string> = { small: "小型", medium: "中型", large: "大型" }
const sizeColors: Record<string, string> = {
  small: "from-mint-300 to-mint-400",
  medium: "from-coral-300 to-coral-400",
  large: "from-amber-300 to-amber-500",
}

export default function Home() {
  const cages = useStore((s) => s.cages)
  const reviews = useStore((s) => s.reviews)
  const users = useStore((s) => s.users)
  const pets = useStore((s) => s.pets)
  const getAvailableCages = useStore((s) => s.getAvailableCages)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = format(new Date(), "yyyy-MM-dd")
  const availableCages = useMemo(() => getAvailableCages(today, today), [today, getAvailableCages])

  const cageStats = useMemo(() => {
    const sizes = ["small", "medium", "large"] as const
    return sizes.map((size) => {
      const total = cages.filter((c) => c.size === size).length
      const available = availableCages.filter((c) => c.size === size).length
      return { size, total, available }
    })
  }, [cages, availableCages])

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
  }, [reviews])

  const reviewData = useMemo(() => {
    return reviews.map((r) => {
      const owner = users.find((u) => u.id === r.ownerId)
      const booking = useStore.getState().bookings.find((b) => b.id === r.bookingId)
      const pet = booking ? pets.find((p) => p.id === booking.petId) : null
      return { ...r, ownerName: owner?.name ?? "匿名", petName: pet?.name ?? "" }
    })
  }, [reviews, users, pets])

  function scrollCarousel(dir: number) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" })
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-b-4xl bg-gradient-to-r from-coral-400 via-coral-300 to-mint-400 px-6 py-16 text-center text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PawPrint className="w-16 h-16 mx-auto mb-4 animate-float" />
          <h1 className="text-3xl md:text-4xl font-display font-extrabold mb-3">
            毛孩寄养 — 给毛孩子一个温暖的家
          </h1>
          <p className="text-white/80 mb-6 text-sm max-w-md mx-auto">
            专业寄养服务，每日看护日记，让您安心出行
          </p>
          <Link
            to="/booking"
            className="inline-block px-8 py-3 bg-white text-coral-400 font-bold rounded-2xl hover:bg-cream-100 transition-colors shadow-card"
          >
            立即预约
          </Link>
        </motion.div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-4xl shadow-card p-6"
        >
          <h2 className="text-lg font-display font-bold text-gray-800 mb-4">毛孩寄养中心</h2>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-coral-400 shrink-0" />
              <span>宠物路88号毛孩大厦</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-coral-400 shrink-0" />
              <span>8:00-20:00</span>
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(avgRating)} size="sm" />
              <span className="font-semibold text-amber-500">{avgRating}</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-lg font-display font-bold text-gray-800 mb-4">笼位概览</h2>
        <div className="grid grid-cols-3 gap-4">
          {cageStats.map((stat, idx) => (
            <motion.div
              key={stat.size}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`bg-gradient-to-br ${sizeColors[stat.size]} rounded-3xl p-5 text-white text-center shadow-card`}
            >
              <p className="text-sm font-semibold opacity-90">{sizeLabels[stat.size]}笼位</p>
              <p className="text-3xl font-extrabold mt-1">{stat.available}</p>
              <p className="text-xs opacity-80 mt-1">可用 / 共 {stat.total}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-gray-800">用户评价</h2>
          <div className="flex gap-2">
            <button
              onClick={() => scrollCarousel(-1)}
              className="p-1.5 rounded-full bg-white shadow-card hover:bg-cream-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => scrollCarousel(1)}
              className="p-1.5 rounded-full bg-white shadow-card hover:bg-cream-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {reviewData.map((r, idx) => (
            <motion.div
              key={`${r.bookingId}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * idx }}
              className="snap-start shrink-0 w-72 bg-white rounded-3xl shadow-card p-5"
            >
              <StarRating rating={r.rating} size="sm" />
              <p className="text-sm text-gray-700 mt-3 line-clamp-3">{r.content}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <span className="font-semibold text-gray-600">{r.ownerName}</span>
                {r.petName && <span>· {r.petName}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 text-center">
        <Link
          to="/booking"
          className="inline-block px-10 py-3.5 bg-coral-400 text-white font-bold rounded-2xl hover:bg-coral-500 transition-colors shadow-glow text-sm"
        >
          快速预约寄养
        </Link>
      </div>
    </div>
  )
}
