"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface AuthModalProps {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"student" | "association" | "prof">("student");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!email.trim() || !password.trim()) { setError("Email et mot de passe requis"); return; }
    if (mode === "signup" && !name.trim()) { setError("Le nom est requis"); return; }
    if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères"); return; }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) {
          await supabase.from("profiles").insert({ id: data.user.id, name: name.trim(), type: userType });
          onSuccess();
        } else {
          setSuccess("Vérifiez votre email pour confirmer votre compte.");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      if (msg.includes("Invalid login credentials")) setError("Email ou mot de passe incorrect");
      else if (msg.includes("already registered")) setError("Cet email est déjà utilisé. Connectez-vous.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(25,28,29,0.55)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 max-h-[90dvh] overflow-y-auto"
        style={{ background: "var(--surface-container-lowest)", boxShadow: "0 32px 80px rgba(25,28,29,0.22)" }}
      >
        {/* Logo */}
        <div className="text-center">
          <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "Manrope, sans-serif", color: "var(--primary)" }}>
            Campus Rooms
          </span>
          <p className="text-sm mt-1.5" style={{ color: "var(--on-surface-variant)" }}>
            {mode === "login" ? "Connectez-vous pour réserver" : "Créez votre compte"}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex rounded-2xl p-1 gap-1" style={{ background: "var(--surface-container-low)" }}>
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: mode === m ? "var(--primary)" : "transparent",
                color: mode === m ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
            >
              {m === "login" ? "Se connecter" : "S'inscrire"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: "var(--surface-container-low)",
                color: "var(--on-surface)",
                border: "1.5px solid var(--surface-container-high)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--surface-container-high)")}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
            style={{
              background: "var(--surface-container-low)",
              color: "var(--on-surface)",
              border: "1.5px solid var(--surface-container-high)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--surface-container-high)")}
          />
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-3 pr-11 rounded-2xl text-sm outline-none transition-all"
              style={{
                background: "var(--surface-container-low)",
                color: "var(--on-surface)",
                border: "1.5px solid var(--surface-container-high)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--surface-container-high)")}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              tabIndex={-1}
            >
              {showPass
                ? <EyeOff className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
                : <Eye className="w-4 h-4" style={{ color: "var(--on-surface-variant)" }} />
              }
            </button>
          </div>

          {mode === "signup" && (
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "student",     label: "🎓 Élève" },
                { key: "association", label: "🏛 Association" },
                { key: "prof",        label: "👨‍🏫 Professeur" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setUserType(key)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: userType === key ? "var(--primary)" : "var(--surface-container-low)",
                    color: userType === key ? "var(--on-primary)" : "var(--on-surface-variant)",
                    border: userType === key ? "1.5px solid transparent" : "1.5px solid var(--surface-container-high)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl px-4 py-3 text-xs text-center" style={{ background: "#ffdad6", color: "#93000a" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl px-4 py-3 text-xs text-center" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
            {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
            color: "var(--on-primary)",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>

        {mode === "signup" && (
          <p className="text-[10px] text-center" style={{ color: "var(--on-surface-variant)" }}>
            En créant un compte, vous acceptez que vos réservations soient visibles par les autres utilisateurs.
          </p>
        )}
      </div>
    </div>
  );
}
