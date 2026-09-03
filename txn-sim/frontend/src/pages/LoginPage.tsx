import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/authContext";
import { SimulationBanner } from "../components/SimulationBanner";

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
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-console-bg text-console-text">
      <SimulationBanner />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="text-lg font-semibold">Protocol Console</div>
            <div className="text-xs text-console-textFaint mt-1">Sign in to continue</div>
          </div>
          <form onSubmit={handleSubmit} className="bg-console-panel border border-console-border rounded-lg shadow-panel p-5 space-y-4">
            <div>
              <label className="block text-xs text-console-textDim mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm focus:border-accent-teal outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-console-textDim mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm focus:border-accent-teal outline-none"
                required
              />
            </div>
            {error && <div className="text-xs text-accent-red">{error}</div>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-accent-teal text-console-bg font-medium text-sm py-2 hover:bg-accent-teal/90 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
