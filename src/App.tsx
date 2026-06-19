import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Booking from "@/pages/Booking";
import MyBookings from "@/pages/MyBookings";
import BookingDetail from "@/pages/BookingDetail";
import StaffWorkstation from "@/pages/StaffWorkstation";
import StaffCheckin from "@/pages/StaffCheckin";
import StaffDiary from "@/pages/StaffDiary";
import StaffIncident from "@/pages/StaffIncident";
import StaffCheckout from "@/pages/StaffCheckout";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminReports from "@/pages/AdminReports";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-bookings/:id" element={<BookingDetail />} />
          <Route path="/staff" element={<StaffWorkstation />} />
          <Route path="/staff/checkin/:id" element={<StaffCheckin />} />
          <Route path="/staff/diary/:bookingId" element={<StaffDiary />} />
          <Route path="/staff/incident/:bookingId" element={<StaffIncident />} />
          <Route path="/staff/checkout/:id" element={<StaffCheckout />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
