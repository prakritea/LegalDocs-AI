import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    username: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string, user: User, rememberMe: boolean) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken =
            sessionStorage.getItem('token') ||
            localStorage.getItem('token');

        const storedUserJson =
            sessionStorage.getItem('user_data') ||
            localStorage.getItem('user_data');

        if (!storedToken) {
            setIsLoading(false);
            return;
        }

        // 🔥 Validate token with backend
        fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
            headers: {
                Authorization: `Bearer ${storedToken}`,
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Invalid token");
                return res.json();
            })
            .then((user) => {
                setToken(storedToken);

                // Prefer backend user (more reliable)
                setUser(user);

                // Optional: sync user_data again
                const storage = sessionStorage.getItem('token')
                    ? sessionStorage
                    : localStorage;

                storage.setItem('user_data', JSON.stringify(user));
            })
            .catch((err) => {
                console.error("Auth validation failed:", err);

                // ❌ Token invalid → force logout
                localStorage.clear();
                sessionStorage.clear();
                setToken(null);
                setUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const login = (newToken: string, newUser: User, rememberMe: boolean) => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('user_data');

        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem('token', newToken);
        storage.setItem('user_data', JSON.stringify(newUser));
        storage.setItem('user_name', newUser.first_name || newUser.username);

        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        // Clear both storages to be safe
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_name');
        localStorage.removeItem('first_name');

        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('user_name');
        sessionStorage.removeItem('first_name');

        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            login,
            logout,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
