import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { loadMeta } from "@/lib/perf";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const meta = await loadMeta();
  const userName = session?.user?.name || session?.user?.email || null;

  return (
    <DashboardShell userName={userName} meta={meta}>
      {children}
    </DashboardShell>
  );
}
