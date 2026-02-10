import { useState, useCallback, createContext, useContext } from 'react';
import { useAuth } from '../components/AuthProvider';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const { user } = useAuth();

    // Profile data comes from Google auth metadata
    const profile = {
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        program: user?.user_metadata?.program || '',
        photoUrl: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
        email: user?.email || '',
    };

    const [localProgram, setLocalProgram] = useState(() => {
        try {
            const saved = localStorage.getItem(`jadwal-program-${user?.id}`);
            return saved || '';
        } catch { return ''; }
    });

    const mergedProfile = {
        ...profile,
        program: localProgram || profile.program,
    };

    const updateProfile = useCallback((updates) => {
        if (updates.program !== undefined) {
            setLocalProgram(updates.program);
            try {
                localStorage.setItem(`jadwal-program-${user?.id}`, updates.program);
            } catch { /* ignore */ }
        }
    }, [user?.id]);

    const resetProfile = useCallback(() => {
        setLocalProgram('');
        try {
            localStorage.removeItem(`jadwal-program-${user?.id}`);
        } catch { /* ignore */ }
    }, [user?.id]);

    return (
        <UserContext.Provider value={{ profile: mergedProfile, updateProfile, resetProfile }}>
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
