import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "../api/client";
import { StatCard, Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";

interface Summary {
  totals: { total: number; verified: number; failed: number; pending: number; running: number };
  protocolDistribution: { protocolCode: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  recent: any[];
}

const PIE_COLORS: Record<string, string> = {
  VERIFIED: "#2DD4BF",
  FAILED: "#F5474C",
  PENDING: "#4F9CF9",
  RUNNING: "#F5A524",
};

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-console-textDim text-sm">Loading dashboard…</div>;
  if (!summary) return <div className="text-console-textDim text-sm">No data available.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-console-textFaint mt-1">
          Overview of transaction simulations.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total simulations" value={summary.totals.total} />
        <StatCard label="Verified" value={summary.totals.verified} tone="teal" />
        <StatCard label="Failed" value={summary.totals.failed} tone="red" />
        <StatCard label="Pending" value={summary.totals.pending} tone="blue" />
        <StatCard label="Running" value={summary.totals.running} tone="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Protocol distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.protocolDistribution}>
              <XAxis dataKey="protocolCode" stroke="#5C6672" fontSize={12} />
              <YAxis stroke="#5C6672" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#171C22", border: "1px solid #232A32", fontSize: 12 }}
                labelStyle={{ color: "#D8DEE4" }}
              />
              <Bar dataKey="count" fill="#2DD4BF" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Status distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={summary.statusDistribution}
                dataKey="count"
                nameKey="status"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {summary.statusDistribution.map((entry) => (
                  <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? "#5C6672"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#171C22", border: "1px solid #232A32", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Recent verification activity" action={<Link to="/transactions" className="text-xs text-accent-teal hover:underline">View all</Link>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-console-textFaint text-xs uppercase tracking-wide border-b border-console-border">
                <th className="py-2 pr-4">Transaction ID</th>
                <th className="py-2 pr-4">Protocol</th>
                <th className="py-2 pr-4">Network</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">When</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent.map((tx) => (
                <tr key={tx.id} className="border-b border-console-border/60 hover:bg-console-panelAlt/50">
                  <td className="py-2 pr-4">
                    <Link to={`/transactions/${tx.id}`} className="data-mono text-accent-teal hover:underline">
                      {tx.testTransactionId}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 data-mono text-console-textDim">{tx.protocol?.code}</td>
                  <td className="py-2 pr-4 text-console-textDim">{tx.cardNetwork}</td>
                  <td className="py-2 pr-4 data-mono">
                    {tx.currency} {Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-2 pr-4 text-console-textFaint text-xs">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {summary.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-console-textFaint text-sm">
                    No simulations yet. Run one from DATA VERIFIED BY JVF VISA/MASTERCARD.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
