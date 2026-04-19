import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Mail, Lock, ArrowRight, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const emailSchema = z.string().email("Email invalid").max(255);
const passwordSchema = z
  .string()
  .min(8, "Minim 8 caractere")
  .max(72, "Maxim 72 caractere");
const nameSchema = z.string().min(2, "Minim 2 caractere").max(80);

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || "/";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailParse = emailSchema.safeParse(email);
      if (!emailParse.success) throw new Error(emailParse.error.errors[0].message);
      const pwParse = passwordSchema.safeParse(password);
      if (!pwParse.success) throw new Error(pwParse.error.errors[0].message);

      if (isSignup) {
        const nameParse = nameSchema.safeParse(fullName);
        if (!nameParse.success) throw new Error(nameParse.error.errors[0].message);

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast({ title: "Cont creat", description: "Ești conectat. Bine ai venit!" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Bun venit înapoi" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ceva nu a mers";
      toast({ title: "Eroare autentificare", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emailParse = emailSchema.safeParse(email);
      if (!emailParse.success) throw new Error(emailParse.error.errors[0].message);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast({
        title: "Verifică-ți emailul",
        description: "Am trimis un link magic. Click pe el pentru a intra.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ceva nu a mers";
      toast({ title: "Eroare", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute inset-0 bg-gradient-glow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold">EduForYou</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Operating System
            </span>
          </div>
        </Link>

        <div className="glass-card rounded-2xl p-6 shadow-card">
          <div className="mb-5 space-y-1 text-center">
            <h1 className="font-display text-2xl font-bold">
              {isSignup ? "Creează contul" : "Bine ai revenit"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignup
                ? "Primul cont devine automat CEO al organizației"
                : "Conectează-te ca să intri în EduForYou OS"}
            </p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Parolă
              </TabsTrigger>
              <TabsTrigger value="magic">
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Magic link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-5">
              <form onSubmit={handlePassword} className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Nume complet</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Cătălin Ene"
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="catalin@eduforyou.ro"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Parolă</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minim 8 caractere"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
                >
                  {loading ? "Se procesează…" : isSignup ? "Creează cont" : "Conectează-te"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  {isSignup ? "Ai deja cont? Conectează-te" : "Nu ai cont? Creează-l acum"}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="magic" className="mt-5">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="catalin@eduforyou.ro"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
                >
                  {loading ? "Se trimite…" : "Trimite magic link"}
                  <Mail className="h-4 w-4" />
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Îți trimitem un link de conectare unic.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Continuând accepți politica de utilizare EduForYou OS.
        </p>
      </motion.div>
    </div>
  );
}
