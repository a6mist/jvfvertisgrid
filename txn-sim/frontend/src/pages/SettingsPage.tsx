import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Panel } from "../components/Panel";
import { useAuth } from "../state/authContext";

export function SettingsPage() {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    api.get("/protocols").then((res) => setProtocols(res.data.protocols));
  }

  useEffect(load, []);

  function selectProtocol(p: any) {
    setMessage(null);
    setSelected({
      ...p,
      inputRequirementsText: (p.inputRequirements as string[]).join("\n"),
      validationRulesText: (p.validationRules as string[]).join("\n"),
      successConditionsText: (p.successConditions as string[]).join("\n"),
      failureConditionsText: (p.failureConditions as string[]).join("\n"),
    });
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.patch(`/protocols/${selected.code}`, {
        name: selected.name,
        description: selected.description,
        version: selected.version,
        active: selected.active,
        inputRequirements: selected.inputRequirementsText.split("\n").map((s: string) => s.trim()).filter(Boolean),
        validationRules: selected.validationRulesText.split("\n").map((s: string) => s.trim()).filter(Boolean),
        successConditions: selected.successConditionsText.split("\n").map((s: string) => s.trim()).filter(Boolean),
        failureConditions: selected.failureConditionsText.split("\n").map((s: string) => s.trim()).filter(Boolean),
      });
      setMessage("Protocol definition updated.");
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.error ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-console-textFaint mt-1">
          Administrator configuration for simulator protocol definitions and test data.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Integration mode">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-console-panelAlt border border-console-border px-2 py-1 text-console-textFaint text-xs">
              Official payment network integration
            </span>
            <span className="text-console-textFaint text-xs">— not available in this build</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-2">
            <span className="rounded-md bg-accent-teal/10 border border-accent-teal/30 px-2 py-1 text-accent-teal text-xs font-medium">
              Simulation / Mock integration
            </span>
            <span className="text-console-textFaint text-xs">— active</span>
          </div>
        </Panel>

        <Panel title="Access">
          <p className="text-xs text-console-textDim leading-relaxed">
            Protocol definitions can only be edited by an ADMIN. Your current role is{" "}
            <span className="data-mono text-console-text">{user?.role}</span>.
          </p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Protocols" className="lg:col-span-1">
          <div className="space-y-1">
            {protocols.map((p) => (
              <button
                key={p.code}
                onClick={() => selectProtocol(p)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm ${
                  selected?.code === p.code ? "bg-accent-teal/10 text-accent-teal" : "hover:bg-console-panelAlt text-console-textDim"
                }`}
              >
                <span className="data-mono">{p.code}</span> — {p.name}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={selected ? `Edit ${selected.code}` : "Select a protocol"} className="lg:col-span-2">
          {!selected && <div className="text-sm text-console-textFaint py-6 text-center">Choose a protocol to view or edit its definition.</div>}
          {selected && (
            <div className="space-y-3">
              <div className="text-xs text-accent-amber">{selected.classificationLabel}</div>
              <div>
                <label className="block text-xs text-console-textDim mb-1.5">Name</label>
                <input
                  disabled={!isAdmin}
                  className="w-full rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm disabled:opacity-60"
                  value={selected.name}
                  onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-console-textDim mb-1.5">Description</label>
                <textarea
                  disabled={!isAdmin}
                  className="w-full rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm disabled:opacity-60"
                  rows={3}
                  value={selected.description}
                  onChange={(e) => setSelected({ ...selected, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-console-textDim mb-1.5">Validation rules (one per line)</label>
                  <textarea
                    disabled={!isAdmin}
                    className="w-full rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-xs data-mono disabled:opacity-60"
                    rows={5}
                    value={selected.validationRulesText}
                    onChange={(e) => setSelected({ ...selected, validationRulesText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-console-textDim mb-1.5">Success conditions (one per line)</label>
                  <textarea
                    disabled={!isAdmin}
                    className="w-full rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-xs data-mono disabled:opacity-60"
                    rows={5}
                    value={selected.successConditionsText}
                    onChange={(e) => setSelected({ ...selected, successConditionsText: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs text-console-textDim">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={selected.active}
                    onChange={(e) => setSelected({ ...selected, active: e.target.checked })}
                  />
                  Active — available for new simulations
                </label>
              </div>
              {isAdmin && (
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-md bg-accent-teal text-console-bg font-medium text-sm px-4 py-2 hover:bg-accent-teal/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              )}
              {message && <div className="text-xs text-console-textDim">{message}</div>}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
