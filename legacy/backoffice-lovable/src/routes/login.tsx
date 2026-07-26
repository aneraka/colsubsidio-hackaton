import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ChefHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — La Cocina2" },
      { name: "description", content: "Acceso al panel de gestión de inventario." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, session, loading } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated → bounce to dashboard
  if (!loading && session) {
    navigate({ to: "/" });
  }

  const resolveEmail = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (!v) return v;
    if (v.includes("@")) return v;
    return `${v.replace(/\s+/g, "")}@lacocina.com`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(resolveEmail(identifier), password);
    setSubmitting(false);
    if (error) {
      toast.error("Credenciales inválidas", { description: error });
      return;
    }
    toast.success("Sesión iniciada");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ChefHat className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">La Cocina2</h1>
            <p className="text-sm text-muted-foreground">Gestión de inventario</p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Usuario o correo</Label>
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="ej. admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ¿Problemas para acceder? Contacta al administrador del sistema.
        </p>
        <div className="mt-2 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
