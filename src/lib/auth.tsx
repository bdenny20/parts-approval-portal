import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Profile } from "../types/domain";

interface AuthContextValue {
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentProfile(session: Session | null): Promise<Profile | null> {
    if (!session?.user?.id) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", session.user.id)
        .eq("is_active", true)
        .maybeSingle();

    if (error) {
        console.error("Profile fetch failed:", error);
        return null;
    }

    return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadAuthState(nextSession: Session | null) {
        setLoading(true);

        try {
            setSession(nextSession);

            if (!nextSession) {
                setProfile(null);
                return;
            }

            const currentProfile = await fetchCurrentProfile(nextSession);
            setProfile(currentProfile);
        } catch (error) {
            console.error("Auth state load failed:", error);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }

    async function refreshProfile() {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Session refresh failed:", error);
            setProfile(null);
            return;
        }

        const currentProfile = await fetchCurrentProfile(data.session);
        setProfile(currentProfile);
    }

    async function signOut() {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setLoading(false);
    }

    useEffect(() => {
        let cancelled = false;

        async function initializeAuth() {
            setLoading(true);

            try {
                const { data, error } = await supabase.auth.getSession();

                if (cancelled) {
                    return;
                }

                if (error) {
                    console.error("Initial session load failed:", error);
                    setSession(null);
                    setProfile(null);
                    return;
                }

                setSession(data.session);

                if (data.session) {
                    const currentProfile = await fetchCurrentProfile(data.session);

                    if (!cancelled) {
                        setProfile(currentProfile);
                    }
                } else {
                    setProfile(null);
                }
            } catch (error) {
                console.error("Initial auth initialization failed:", error);
                setSession(null);
                setProfile(null);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        initializeAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            window.setTimeout(() => {
                if (!cancelled) {
                    void loadAuthState(nextSession);
                }
            }, 0);
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            session,
            profile,
            loading,
            refreshProfile,
            signOut,
        }),
        [session, profile, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const value = useContext(AuthContext);

    if (!value) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }

    return value;
}