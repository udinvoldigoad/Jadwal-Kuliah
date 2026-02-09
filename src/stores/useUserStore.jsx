import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const UserContext = createContext(null);

const STORAGE_KEY = 'jadwal-user-profile';

const defaultProfile = {
    name: '',
    program: '',
    photoUrl: '',
};

export function UserProvider({ children }) {
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultProfile;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }, [profile]);

    const updateProfile = useCallback((updates) => {
        setProfile(prev => ({ ...prev, ...updates }));
    }, []);

    const resetProfile = useCallback(() => {
        setProfile(defaultProfile);
    }, []);

    return (
        <UserContext.Provider value={{ profile, updateProfile, resetProfile }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
