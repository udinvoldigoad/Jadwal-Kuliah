import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../contexts/AuthContext';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => Boolean(supabase));

    useEffect(() => {
        if (!supabase) return;

        let isMounted = true;

        // Get initial session
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                if (!isMounted) return;
                setUser(session?.user ?? null);
                setLoading(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error('Failed to get session:', err);
                setLoading(false);
            });

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        if (!supabase) {
            throw new Error('Supabase tidak tersedia. Periksa konfigurasi.');
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) {
            console.error('Login error:', error.message);
            throw error;
        }
    };

    const signOut = async () => {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error.message);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
