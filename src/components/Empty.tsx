import type { ReactNode } from "react"

interface EmptyProps {
  message?: string
  icon?: ReactNode
}

export default function Empty({ message = "暂无数据", icon }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  )
}
