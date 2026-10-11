import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/client";
import { Alert, Button, Card, Input } from "@/components/ui";

//const DEMO_HINTS = [
 // ["superadmin@misalud.com", "Admin123!", "Administrador global"],
  //["supervisor.cali@misalud.com", "Supervisor123!", "Supervisor ciudad Cali"],
  //["vendedor.cali@misalud.com", "Vendedor123!", "Vendedor sucursal Cali Centro"],
//] as const;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      navigate(user.role === "vendedor" ? "/pos" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setSubmitting(false);
    }
  }

  function fill(em: string, pw: string) {
    setEmail(em);
    setPassword(pw);
    setError(null);
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
            M
          </div>
          <h1 className="text-2xl font-bold text-slate-800">MiSalud</h1>
          <p className="text-sm text-slate-500">
            Sistema de gestión para droguerías
          </p>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@misalud.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••••"
                required
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </Card>
      {/*   <div className="mt-5">
          { <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
          Cuentas de prueba cargadas en el sistema
          </p> }
          <div className="space-y-2">
            {DEMO_HINTS.map(([em, pw, label]) => (
              <button
                key={em}
                type="button"
                onClick={() => fill(em, pw)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-left text-sm transition hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="font-semibold text-slate-700">{label}</span>
                <span className="block text-xs text-slate-400">
                  {em} · {pw}
                </span>
              </button>
            ))} 
          </div> 
        </div>*/}
      </div>
    </div>
  );
}