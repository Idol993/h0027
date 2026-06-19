import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
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
          <Route path="/booking" element={
            <ProtectedRoute allowedRoles={["owner"]}><Booking /></ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute allowedRoles={["owner"]}><MyBookings /></ProtectedRoute>
          } />
          <Route path="/my-bookings/:id" element={
            <ProtectedRoute allowedRoles={["owner"]}><BookingDetail /></ProtectedRoute>
          } />
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={["caretaker"]}><StaffWorkstation /></ProtectedRoute>
          } />
          <Route path="/staff/checkin/:bookingId" element={
            <ProtectedRoute allowedRoles={["caretaker"]}><StaffCheckin /></ProtectedRoute>
          } />
          <Route path="/staff/diary/:bookingId" element={
            <ProtectedRoute allowedRoles={["caretaker"]}><StaffDiary /></ProtectedRoute>
          } />
          <Route path="/staff/incident/:bookingId" element={
            <ProtectedRoute allowedRoles={["caretaker"]}><StaffIncident /></ProtectedRoute>
          } />
          <Route path="/staff/checkout/:bookingId" element={
            <ProtectedRoute allowedRoles={["caretaker"]}><StaffCheckout /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
