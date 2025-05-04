import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { supabase } from "../lib/supabase";

type AuthContextType = {
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    session: any | null;
    user: any | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    signIn: async () => { },
    signOut: async () => { },
    session: null,
    user: null,
    isLoading: false,
});

export function useSession() {
    return useContext(AuthContext);
}

export function SessionProvider({ children }: PropsWithChildren) {
    const [session, setSession] = useState<any | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Inicial: obtener sesión actual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Escuchar cambios de sesión
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    // Métodos de login/logout
    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ signIn, signOut, session, user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}