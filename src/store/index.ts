import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { differenceInCalendarDays, parseISO } from "date-fns"
import type {
  User,
  Pet,
  Cage,
  Booking,
  CareDiary,
  Incident,
  Review,
  Bill,
  BillExtra,
  DashboardStats,
  ReportFilters,
  CheckinRecord,
  IncidentType,
} from "@/types"
import {
  mockUsers,
  mockPets,
  mockCages,
  mockBookings,
  mockDiaries,
  mockIncidents,
  mockReviews,
} from "@/data/mockData"

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

interface Notification {
  id: string
  message: string
  type: "success" | "error" | "warning" | "info"
  createdAt: string
}

interface StoreState {
  currentUser: User | null
  users: User[]
  pets: Pet[]
  cages: Cage[]
  bookings: Booking[]
  diaries: CareDiary[]
  incidents: Incident[]
  reviews: Review[]
  notifications: Notification[]
}

interface StoreActions {
  login(phone: string, password: string): User | null
  logout(): void
  register(user: Omit<User, "id">): User
  getAvailableCages(startDate: string, endDate: string): Cage[]
  getAlternativeDates(startDate: string, endDate: string): { startDate: string; endDate: string; availableCages: Cage[] }[]
  createBooking(data: { ownerId: string; petId: string; cageId: string; startDate: string; endDate: string; dailyRate: number }): Booking
  getBookingsByOwner(ownerId: string): Booking[]
  getBookingById(id: string): Booking | undefined
  checkInBooking(bookingId: string, record: Omit<CheckinRecord, "bookingId">): void
  addCareDiary(bookingId: string, content: string, images: string[], createdBy: string): CareDiary | null
  addIncident(bookingId: string, type: IncidentType, description: string, photos: string[], createdBy: string): Incident
  viewIncident(incidentId: string): void
  remindIncident(incidentId: string): void
  escalateIncident(incidentId: string): void
  checkOutBooking(bookingId: string, extras?: BillExtra[]): void
  submitReview(bookingId: string, rating: number, content: string): boolean
  getDashboardStats(): DashboardStats
  getFilteredRecords(filters: ReportFilters): Booking[]
  addNotification(message: string, type: "success" | "error" | "warning" | "info"): void
  removeNotification(id: string): void
  getPetsByOwner(ownerId: string): Pet[]
}

type Store = StoreState & StoreActions

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: mockUsers,
      pets: mockPets,
      cages: mockCages,
      bookings: mockBookings,
      diaries: mockDiaries,
      incidents: mockIncidents,
      reviews: mockReviews,
      notifications: [],

      login(phone, password) {
        const user = get().users.find((u) => u.phone === phone && u.password === password)
        if (user) {
          set({ currentUser: user })
        }
        return user ?? null
      },

      logout() {
        set({ currentUser: null })
      },

      register(userData) {
        const user: User = { ...userData, id: genId() }
        set((state) => ({ users: [...state.users, user] }))
        return user
      },

      getAvailableCages(startDate, endDate) {
        const { bookings, cages } = get()
        const activeBookings = bookings.filter(
          (b) =>
            (b.status === "pending" || b.status === "confirmed" || b.status === "checked_in") &&
            b.startDate <= endDate &&
            b.endDate >= startDate
        )
        const bookedCageIds = new Set(activeBookings.map((b) => b.cageId))
        return cages.filter((c) => !bookedCageIds.has(c.id))
      },

      getAlternativeDates(startDate, endDate) {
        const results: { startDate: string; endDate: string; availableCages: Cage[] }[] = []
        let offset = 1
        const start = new Date(startDate)
        const end = new Date(endDate)
        const duration = differenceInCalendarDays(end, start)
        while (results.length < 3) {
          const newStart = new Date(start)
          newStart.setDate(newStart.getDate() + offset)
          const newEnd = new Date(newStart)
          newEnd.setDate(newEnd.getDate() + duration)
          const ns = newStart.toISOString().split("T")[0]
          const ne = newEnd.toISOString().split("T")[0]
          const available = get().getAvailableCages(ns, ne)
          if (available.length > 0) {
            results.push({ startDate: ns, endDate: ne, availableCages: available })
          }
          offset++
        }
        return results
      },

      createBooking(data) {
        const booking: Booking = {
          id: genId(),
          ...data,
          status: "confirmed",
          createdAt: new Date().toISOString().split("T")[0],
        }
        set((state) => ({ bookings: [...state.bookings, booking] }))
        get().addNotification("预约创建成功", "success")
        return booking
      },

      getBookingsByOwner(ownerId) {
        return get()
          .bookings.filter((b) => b.ownerId === ownerId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      },

      getBookingById(id) {
        return get().bookings.find((b) => b.id === id)
      },

      checkInBooking(bookingId, record) {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId
              ? { ...b, status: "checked_in" as const, checkinRecord: { ...record, bookingId } }
              : b
          ),
        }))
        get().addNotification("入住登记完成", "success")
      },

      addCareDiary(bookingId, content, images, createdBy) {
        const { diaries } = get()
        const today = new Date().toISOString().split("T")[0]
        const todayCount = diaries.filter(
          (d) => d.bookingId === bookingId && d.createdAt.startsWith(today)
        ).length
        if (todayCount >= 2) return null
        const diary: CareDiary = {
          id: genId(),
          bookingId,
          content,
          images,
          createdAt: new Date().toISOString(),
          createdBy,
        }
        set((state) => ({ diaries: [...state.diaries, diary] }))
        return diary
      },

      addIncident(bookingId, type, description, photos, createdBy) {
        const incident: Incident = {
          id: genId(),
          bookingId,
          type,
          description,
          photos,
          createdAt: new Date().toISOString(),
          createdBy,
          notifyStatus: "sent",
        }
        set((state) => ({ incidents: [...state.incidents, incident] }))
        get().addNotification("发生异常事件，请及时查看", "warning")
        return incident
      },

      viewIncident(incidentId) {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === incidentId
              ? { ...i, notifyStatus: "viewed" as const, viewedAt: new Date().toISOString() }
              : i
          ),
        }))
      },

      remindIncident(incidentId) {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === incidentId ? { ...i, notifyStatus: "reminded" as const } : i
          ),
        }))
      },

      escalateIncident(incidentId) {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === incidentId ? { ...i, notifyStatus: "escalated" as const } : i
          ),
        }))
        get().addNotification("事件已升级，请联系管理员处理", "error")
      },

      checkOutBooking(bookingId, extras?) {
        const booking = get().bookings.find((b) => b.id === bookingId)
        if (!booking) return
        const today = new Date().toISOString().split("T")[0]
        const days = Math.max(1, differenceInCalendarDays(parseISO(today), parseISO(booking.startDate)))
        const subtotal = days * booking.dailyRate
        const billExtras = extras ?? []
        const extrasTotal = billExtras.reduce((sum, e) => sum + e.amount, 0)
        const bill: Bill = {
          bookingId,
          days,
          dailyRate: booking.dailyRate,
          subtotal,
          extras: billExtras,
          total: subtotal + extrasTotal,
          generatedAt: new Date().toISOString(),
        }
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId
              ? { ...b, status: "checked_out" as const, actualEndDate: today, bill }
              : b
          ),
        }))
        get().addNotification("退房结算完成", "success")
      },

      submitReview(bookingId, rating, content) {
        const booking = get().bookings.find((b) => b.id === bookingId)
        if (!booking || !booking.actualEndDate) return false
        const hoursDiff =
          (Date.now() - parseISO(booking.actualEndDate).getTime()) / (1000 * 60 * 60)
        if (hoursDiff > 72) return false
        const review: Review = {
          bookingId,
          ownerId: booking.ownerId,
          rating,
          content,
          createdAt: new Date().toISOString().split("T")[0],
        }
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, review } : b
          ),
          reviews: [...state.reviews, review],
        }))
        return true
      },

      getDashboardStats() {
        const { bookings, cages, reviews } = get()
        const today = new Date().toISOString().split("T")[0]
        const todayInResidence = bookings.filter((b) => b.status === "checked_in").length
        const todayCheckins = bookings.filter(
          (b) => b.checkinRecord && b.checkinRecord.checkedInAt.startsWith(today)
        ).length
        const todayCheckouts = bookings.filter(
          (b) => b.actualEndDate && b.actualEndDate.startsWith(today) && b.status === "checked_out"
        ).length
        const pendingCheckins = bookings.filter((b) => b.status === "confirmed").length

        const currentMonth = today.substring(0, 7)
        const monthBookings = bookings.filter((b) => b.createdAt.startsWith(currentMonth))
        const dailyMap: Record<string, number> = {}
        monthBookings.forEach((b) => {
          dailyMap[b.createdAt] = (dailyMap[b.createdAt] || 0) + 1
        })
        const monthlyBookings = Object.entries(dailyMap)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))

        const sizeGroups: Record<string, { total: number; occupied: number }> = {}
        cages.forEach((c) => {
          if (!sizeGroups[c.size]) sizeGroups[c.size] = { total: 0, occupied: 0 }
          sizeGroups[c.size].total++
        })
        const occupiedCageIds = new Set(
          bookings.filter((b) => b.status === "checked_in").map((b) => b.cageId)
        )
        cages.forEach((c) => {
          if (occupiedCageIds.has(c.id)) {
            sizeGroups[c.size].occupied++
          }
        })
        const cageUsage = (["small", "medium", "large"] as const).map((size) => ({
          size,
          total: sizeGroups[size]?.total ?? 0,
          occupied: sizeGroups[size]?.occupied ?? 0,
        }))

        const allRatings = reviews.map((r) => r.rating)
        const averageRating =
          allRatings.length > 0
            ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
            : 0
        const ratingMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        allRatings.forEach((r) => {
          ratingMap[r] = (ratingMap[r] || 0) + 1
        })
        const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => ({
          rating,
          count: ratingMap[rating] || 0,
        }))

        return {
          todayInResidence,
          todayCheckins,
          todayCheckouts,
          pendingCheckins,
          monthlyBookings,
          cageUsage,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution,
        }
      },

      getFilteredRecords(filters) {
        const { bookings, incidents } = get()
        return bookings.filter((b) => {
          if (filters.startDate && b.startDate < filters.startDate) return false
          if (filters.endDate && b.endDate > filters.endDate) return false
          if (filters.rating !== undefined) {
            if (!b.review || b.review.rating < filters.rating) return false
          }
          if (filters.incidentType) {
            const hasIncident = incidents.some(
              (i) => i.bookingId === b.id && i.type === filters.incidentType
            )
            if (!hasIncident) return false
          }
          return true
        })
      },

      addNotification(message, type) {
        const notification: Notification = {
          id: genId(),
          message,
          type,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ notifications: [...state.notifications, notification] }))
      },

      removeNotification(id) {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      getPetsByOwner(ownerId) {
        return get().pets.filter((p) => p.ownerId === ownerId)
      },
    }),
    {
      name: "pet-boarding-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
