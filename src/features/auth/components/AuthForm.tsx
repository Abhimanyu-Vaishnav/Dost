"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./AuthForm.module.css";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter your Email or Username and Password");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error(`Server returned non-JSON response (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (mode === "login" && typeof window !== "undefined") {
        sessionStorage.setItem("dost_login_toast", JSON.stringify({ 
          message: `New login detected from ${data.loginDevice || "Device"}` 
        }));
      }

      window.location.href = "/feed";
    } catch (err: any) {
      setError(err.message || "Authentication error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`glass ${styles.formCard}`}>
        <h2 className={`text-h2 ${styles.title}`}>
          {mode === "login" ? "Welcome Back" : "Join DOST"}
        </h2>
        
        {error && <p className={styles.error}>{error}</p>}

        {mode === "register" && (
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Full Name</label>
            <input
              className={styles.input}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="email">
            {mode === "login" ? "Email or Username" : "Email Address"}
          </label>
          <input
            className={styles.input}
            id="email"
            type={mode === "login" ? "text" : "email"}
            placeholder={mode === "login" ? "e.g. sumit or sumit@gmail.com" : "name@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            className={styles.input}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            required
          />
        </div>

        <button type="button" onClick={() => handleSubmit()} className={styles.button} disabled={isLoading}>
          {isLoading ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}
        </button>

        {mode === "login" ? (
          <Link href="/register" className={styles.link}>
            Don't have an account? Sign up
          </Link>
        ) : (
          <Link href="/login" className={styles.link}>
            Already have an account? Log in
          </Link>
        )}
      </div>
    </div>
  );
}
