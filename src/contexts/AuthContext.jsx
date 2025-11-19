import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getToken, setToken, removeToken } from "../utils/token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const decoded = jwtDecode(token);

                setUser(decoded);
                setRoles(
                    decoded.role
                        ? Array.isArray(decoded.role)
                            ? decoded.role
                            : [decoded.role]
                        : []
                );
                setIsAuthenticated(true);
            } catch (exception) {
                console.warn("Invalid token");
                logout();
            }
        }
    }, []);

    function login(token) {
        setToken(token);
        const decoded = jwtDecode(token);

        setUser(decoded);
        setRoles(
            decoded.role
                ? Array.isArray(decoded.role)
                    ? decoded.role
                    : [decoded.role]
                : []
        );
        setIsAuthenticated(true);
    }

    function logout() {
        removeToken();
        setUser(null);
        setRoles([]);
        setIsAuthenticated(false);
    }

    function hasRole(role) {
        return roles.includes(role);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                roles,
                isAuthenticated,
                login,
                logout,
                hasRole
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
