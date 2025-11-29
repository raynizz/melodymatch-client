import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Home from "../pages/home/Home";
import ProfilePage from "../pages/profile/ProfilePage";
import MatchPage from "../pages/match/MatchPage";
import LikesPage from "../pages/likes/LikesPage";
import ChatPage from "../pages/chat/ChatPage";
import ChatThreadPage from "../pages/chat/ChatThreadPage";
import RoleRoute from "../components/auth/RoleRoute";
import AdminComplaintsPage from "../pages/admin/AdminComplaintsPage";
import { Roles } from "../types/roles";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/profile"
        element={
          <RoleRoute allowedRoles={[Roles.Dater, Roles.Admin]}>
            <ProfilePage />
          </RoleRoute>
        }
      />
      <Route
        path="/match"
        element={
          <RoleRoute allowedRoles={[Roles.Dater]}>
            <MatchPage />
          </RoleRoute>
        }
      />
      <Route
        path="/likes"
        element={
          <RoleRoute allowedRoles={[Roles.Dater]}>
            <LikesPage />
          </RoleRoute>
        }
      />
      <Route
        path="/chats"
        element={
          <RoleRoute allowedRoles={[Roles.Dater]}>
            <ChatPage />
          </RoleRoute>
        }
      />
      <Route
        path="/chats/:chatId"
        element={
          <RoleRoute allowedRoles={[Roles.Dater]}>
            <ChatThreadPage />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <RoleRoute allowedRoles={[Roles.Admin]}>
            <AdminComplaintsPage />
          </RoleRoute>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
