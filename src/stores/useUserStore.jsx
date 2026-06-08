import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserContext } from '../contexts/UserContext';

function loadLocalProfile(userId) {
    if (!userId) return {};
    try {
        return JSON.parse(localStorage.getItem(`jadwal-profile-${userId}`) || '{}');
    } catch {
        return {};
    }
}

function saveLocalProfile(userId, profile) {
    if (!userId) return;
    try {
        localStorage.setItem(`jadwal-profile-${userId}`, JSON.stringify(profile));
    } catch {
        // Local profile is a convenience; auth metadata remains the source of truth.
    }
}

export function UserProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id;

    // Profile data comes from Google auth metadata
    const profile = {
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || '',
        program: user?.user_metadata?.program || '',
        photoUrl: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
        email: user?.email || '',
    };

    const [localProfile, setLocalProfile] = useState(() => loadLocalProfile(userId));

    const mergedProfile = {
        ...profile,
        ...localProfile,
    };

    const updateProfile = (updates) => {
        setLocalProfile((current) => {
            const next = {
                ...current,
                name: updates.name?.trim() || profile.name,
                program: updates.program?.trim() || profile.program,
                photoUrl: updates.photoUrl?.trim() || profile.photoUrl,
            };
            saveLocalProfile(userId, next);
            return next;
        });
    };

    const resetProfile = () => {
        setLocalProfile({});
        try {
            localStorage.removeItem(`jadwal-profile-${userId}`);
            localStorage.removeItem(`jadwal-program-${userId}`);
        } catch {
            // ignore
        }
    };

    return (
        <UserContext.Provider value={{ profile: mergedProfile, updateProfile, resetProfile }}>
            {children}
        </UserContext.Provider>
    );
}
