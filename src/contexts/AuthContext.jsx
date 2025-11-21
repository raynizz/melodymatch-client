import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getAccessToken, setTokens, clearTokens } from "../utils/token";
import { getMelodyMatchUserByUsername } from "../api/melodyMatchUserService";

const AuthContext = createContext(null);

const emptyAuthState = () => ({
    user: null,
    roles: [],
    identityUserId: null,
    identityUserName: null,
    isAuthenticated: false
});

function extractIdentityUserId(decodedToken) {
    if (!decodedToken) {
        return null;
    }
    return (
        decodedToken.sub ||
        decodedToken.userId ||
        decodedToken.identityUserId ||
        decodedToken.id ||
        null
    );
}

function extractIdentityUserName(decodedToken) {
    if (!decodedToken) {
        return null;
    }

    return (
        decodedToken.preferred_username ||
        decodedToken.userName ||
        decodedToken.username ||
        decodedToken.email ||
        decodedToken.name ||
        null
    );
}

function extractRoles(decoded) {
    if (!decoded?.role) {
        return [];
    }

    return Array.isArray(decoded.role) ? decoded.role : [decoded.role];
}

function readAuthSnapshot() {
    const token = getAccessToken();
    if (!token) {
        return emptyAuthState();
    }

    try {
        const decoded = jwtDecode(token);
        return {
            user: decoded,
            roles: extractRoles(decoded),
            identityUserId: extractIdentityUserId(decoded),
            identityUserName: extractIdentityUserName(decoded),
            isAuthenticated: true
        };
    } catch (error) {
        console.warn("Invalid token", error);
        clearTokens();
        return emptyAuthState();
    }
}

export function AuthProvider({ children }) {
    const [authState, setAuthState] = useState(readAuthSnapshot);
    const [currentMelodyUser, setCurrentMelodyUser] = useState(null);
    const [isMelodyUserLoading, setIsMelodyUserLoading] = useState(false);

    const loadMelodyUser = useCallback(async (username) => {
        if (!username) {
            setCurrentMelodyUser(null);
            return null;
        }

        setIsMelodyUserLoading(true);
        try {
            const data = await getMelodyMatchUserByUsername(username);
            setCurrentMelodyUser(data);
            return data;
        } catch (error) {
            if (error?.response?.status === 404) {
                setCurrentMelodyUser(null);
                return null;
            }
            console.warn("Failed to load MelodyMatch user", error);
            return null;
        } finally {
            setIsMelodyUserLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMelodyUser(authState.identityUserName);
    }, [authState.identityUserName, loadMelodyUser]);

    const login = useCallback((accessToken, refreshToken) => {
        setTokens({ accessToken, refreshToken });
        const decoded = jwtDecode(accessToken);
        const identityUserName = extractIdentityUserName(decoded);
        setAuthState({
            user: decoded,
            roles: extractRoles(decoded),
            identityUserId: extractIdentityUserId(decoded),
            identityUserName,
            isAuthenticated: true
        });
        loadMelodyUser(identityUserName);
    }, [loadMelodyUser]);

    const logout = useCallback(() => {
        clearTokens();
        setAuthState(emptyAuthState());
        setCurrentMelodyUser(null);
    }, []);

    const hasRole = useCallback(
        (role) => authState.roles.includes(role),
        [authState.roles]
    );

    const refreshCurrentMelodyUser = useCallback(() => {
        return loadMelodyUser(authState.identityUserName);
    }, [authState.identityUserName, loadMelodyUser]);

    return (
        <AuthContext.Provider
            value={{
                user: authState.user,
                roles: authState.roles,
                isAuthenticated: authState.isAuthenticated,
                identityUserId: authState.identityUserId,
                identityUserName: authState.identityUserName,
                currentMelodyUser,
                isMelodyUserLoading,
                login,
                logout,
                hasRole,
                refreshCurrentMelodyUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}
