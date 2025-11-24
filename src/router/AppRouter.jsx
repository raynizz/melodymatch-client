import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Home from "../pages/home/Home";
import ProfilePage from "../pages/profile/ProfilePage";
import MatchPage from "../pages/match/MatchPage";
import LikesPage from "../pages/likes/LikesPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/match" element={<MatchPage />} />
      <Route path="/likes" element={<LikesPage />} />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
