import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
// import Home from "../pages/Home";
// import SwipePage from "../pages/matching/SwipePage";
// import MyProfile from "../pages/profile/MyProfile";
// import EditProfile from "../pages/profile/EditProfile";
// import ChatsList from "../pages/chat/ChatsList";
// import ChatRoom from "../pages/chat/ChatRoom";
// import ComplaintsPage from "../pages/admin/ComplaintsPage";

export default function AppRouter() {
    const { isAuthenticated, hasRole } = useAuth();

    return (
        <BrowserRouter>
            <Routes>

                {/* публічні сторінки */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />


                {/* приватні сторінки 
                <Route
                    path="/"
                    element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
                />

                <Route
                    path="/swipe"
                    element={isAuthenticated ? <SwipePage /> : <Navigate to="/login" />}
                />

                <Route
                    path="/profile"
                    element={isAuthenticated ? <MyProfile /> : <Navigate to="/login" />}
                />

                <Route
                    path="/profile/edit"
                    element={isAuthenticated ? <EditProfile /> : <Navigate to="/login" />}
                />

                <Route
                    path="/chats"
                    element={isAuthenticated ? <ChatsList /> : <Navigate to="/login" />}
                />

                <Route
                    path="/chats/:id"
                    element={isAuthenticated ? <ChatRoom /> : <Navigate to="/login" />}
                />

                {/* Admin-only 
                <Route
                    path="/admin/complaints"
                    element={
                        isAuthenticated && hasRole("Admin")
                            ? <ComplaintsPage />
                            : <Navigate to="/" />
                    }
                />
*/}

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" />} />

            </Routes>
        </BrowserRouter>
    );
}
