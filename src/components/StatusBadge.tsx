import type { BookingStatus } from "@/types"

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: "待确认", className: "badge-pending" },
  confirmed: { label: "已确认", className: "badge-confirmed" },
  checked_in: { label: "在住中", className: "badge-checked-in" },
  checked_out: { label: "已离店", className: "badge-checked-out" },
  cancelled: { label: "已取消", className: "badge-cancelled" },
}

interface StatusBadgeProps {
  status: BookingStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return <span className={config.className}>{config.label}</span>
}
