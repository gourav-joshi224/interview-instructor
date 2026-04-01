"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { buildBackendUrl } from "@/lib/backend";
import { auth, signInWithGoogle } from "@/lib/firebase-client";

type AuthUser = {
  uid: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthUser(
  firebaseUser: { uid: string; displayName: string | null; email: string | null } | null,
): AuthUser | null {
  if (!firebaseUser) {
    return null;
  }

  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName ?? "",
    email: firebaseUser.email ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(mapAuthUser(firebaseUser));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      const token = await auth.currentUser?.getIdToken();

      if (token && result.uid && result.email) {
        try {
          await fetch(buildBackendUrl("/users/sync"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: result.name,
              email: result.email,
            }),
          });
        } catch {
          // Non-fatal: user can still use the app even if sync fails.
          // The record will be created on next successful sign-in.
        }
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
