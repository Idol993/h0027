import type { Cage } from "@/types"
import { motion } from "framer-motion"

const sizeLabel = { small: "小", medium: "中", large: "大" }

interface CageGridProps {
  cages: Cage[]
  occupiedIds: string[]
  onSelect?: (cage: Cage) => void
  selectedId?: string
}

export default function CageGrid({ cages, occupiedIds, onSelect, selectedId }: CageGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {cages.map((cage) => {
        const occupied = occupiedIds.includes(cage.id)
        const selected = cage.id === selectedId
        const clickable = !occupied && !!onSelect

        return (
          <motion.div
            key={cage.id}
            whileHover={clickable ? { scale: 1.03 } : undefined}
            whileTap={clickable ? { scale: 0.97 } : undefined}
            onClick={clickable ? () => onSelect(cage) : undefined}
            className={`
              relative rounded-2xl p-4 flex flex-col items-center justify-center gap-1 transition-colors
              ${selected ? "border-2 border-coral-400 bg-coral-50" : occupied ? "bg-gray-100 border-2 border-transparent" : "bg-mint-50 border-2 border-transparent"}
              ${clickable ? "cursor-pointer" : "cursor-default"}
            `}
          >
            {!occupied && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-mint-400 animate-pulse-slow" />
            )}
            <span className={`text-sm font-bold ${occupied ? "text-gray-400" : "text-gray-700"}`}>
              {cage.name}
            </span>
            <span className={`text-xs ${occupied ? "text-gray-300" : "text-gray-500"}`}>
              {sizeLabel[cage.size]}
            </span>
            {occupied && (
              <span className="text-[10px] text-gray-400 mt-0.5">已占用</span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
