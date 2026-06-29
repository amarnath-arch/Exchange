"use client";

import { signInUser, signUpUser } from "@/app/utils/httpClient";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthContextType {
  isLoggedIn: boolean;
  logIn: (mode: "signin" | "signup", email: string, password: string) => void;
  logOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
  }, []);

  function logOut() {
    localStorage.removeItem("token");
    setLoggedIn(false);
  }

  async function logIn(
    mode: "signup" | "signin",
    email: string,
    password: string,
  ) {
    try {
      let res;
      if (mode == "signup") {
        res = await signUpUser(email, password);
      } else {
        res = await signInUser(email, password);
      }
    } catch (err) {
      console.error(err);
    }

    const token = localStorage.getItem("token");
    setLoggedIn(!!token);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
