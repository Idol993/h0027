import { useState } from "react"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

const sizeMap = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" }

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  size?: "sm" | "md" | "lg"
}

export default function StarRating({ rating, onChange, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const interactive = !!onChange
  const iconClass = sizeMap[size]

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (interactive && hovered ? hovered : rating)
        return (
          <motion.span
            key={star}
            whileHover={interactive ? { scale: 1.2 } : undefined}
            whileTap={interactive ? { scale: 0.9 } : undefined}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            onMouseEnter={interactive ? () => setHovered(star) : undefined}
            onMouseLeave={interactive ? () => setHovered(0) : undefined}
            onClick={interactive ? () => onChange(star) : undefined}
          >
            <Star
              className={`${iconClass} transition-colors ${
                filled ? "fill-amber-400 text-amber-400" : "fill-gray-300 text-gray-300"
              }`}
            />
          </motion.span>
        )
      })}
    </div>
  )
}
