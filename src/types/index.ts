export type UserRole = "owner" | "caretaker" | "admin"

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled"

export type IncidentType = "vomiting" | "refusing_food" | "injury" | "other"

export type PetSpirit = "energetic" | "calm" | "lethargic" | "anxious"

export type PetDiet = "normal" | "reduced" | "refusing"

export type PetType = "dog" | "cat" | "other"

export type CageSize = "small" | "medium" | "large"

export type NotifyStatus = "sent" | "viewed" | "reminded" | "escalated"

export interface User {
  id: string
  name: string
  phone: string
  role: UserRole
  avatar?: string
  password?: string
}

export interface Pet {
  id: string
  ownerId: string
  name: string
  type: PetType
  breed: string
  age: number
  weight: number
  specialNeeds?: string
  vaccinated: boolean
  photoUrl?: string
}

export interface Cage {
  id: string
  name: string
  size: CageSize
  dailyRate: number
}

export interface SmsRecord {
  id: string
  recipient: string
  recipientPhone: string
  content: string
  sentAt: string
}

export type PaymentType = "deposit" | "balance"
export type RefundReason = "cancellation"

export interface Payment {
  id: string
  type: PaymentType
  amount: number
  paidAt: string
}

export interface Refund {
  id: string
  amount: number
  reason: RefundReason
  daysBeforeCheckin: number
  refundedAt: string
}

export interface Booking {
  id: string
  ownerId: string
  petId: string
  cageId: string
  startDate: string
  endDate: string
  actualEndDate?: string
  status: BookingStatus
  createdAt: string
  dailyRate: number
  totalAmount: number
  depositAmount: number
  balanceAmount: number
  payments: Payment[]
  refunds: Refund[]
  checkinRecord?: CheckinRecord
  bill?: Bill
  review?: Review
  smsRecords?: SmsRecord[]
  cancelledAt?: string
  cancellationNote?: string
}

export interface CheckinRecord {
  bookingId: string
  spirit: PetSpirit
  diet: PetDiet
  medicationNeeded: boolean
  medicationDetail?: string
  photos: string[]
  checkedInAt: string
  checkedInBy: string
}

export interface CareDiary {
  id: string
  bookingId: string
  content: string
  images: string[]
  createdAt: string
  createdBy: string
}

export interface Incident {
  id: string
  bookingId: string
  type: IncidentType
  description: string
  photos: string[]
  createdAt: string
  createdBy: string
  notifyStatus: NotifyStatus
  viewedAt?: string
}

export interface Bill {
  bookingId: string
  days: number
  dailyRate: number
  subtotal: number
  extras: BillExtra[]
  total: number
  generatedAt: string
}

export interface BillExtra {
  name: string
  amount: number
}

export interface Review {
  bookingId: string
  ownerId: string
  rating: number
  content: string
  createdAt: string
}

export interface DashboardStats {
  todayInResidence: number
  todayCheckins: number
  todayCheckouts: number
  pendingCheckins: number
  monthlyBookings: { date: string; count: number }[]
  cageUsage: { size: CageSize; total: number; occupied: number }[]
  averageRating: number
  ratingDistribution: { rating: number; count: number }[]
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  rating?: number
  incidentType?: IncidentType | ""
  ownerId?: string
  cageSize?: CageSize | ""
  status?: BookingStatus | ""
}
