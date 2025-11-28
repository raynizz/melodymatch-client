import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Home from "../pages/home/Home";
import ProfilePage from "../pages/profile/ProfilePage";
import MatchPage from "../pages/match/MatchPage";
import LikesPage from "../pages/likes/LikesPage";
import ChatPage from "../pages/chat/ChatPage";
import ChatThreadPage from "../pages/chat/ChatThreadPage";
import AdminRoute from "../components/auth/AdminRoute";
import AdminComplaintsPage from "../pages/admin/AdminComplaintsPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/match" element={<MatchPage />} />
      <Route path="/likes" element={<LikesPage />} />
      <Route path="/chats" element={<ChatPage />} />
      <Route path="/chats/:chatId" element={<ChatThreadPage />} />
      <Route
        path="/admin/complaints"
        element={
          <AdminRoute>
            <AdminComplaintsPage />
          </AdminRoute>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
