import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";

export default function SuperAdminDashboardPage() {
  return (
    <PageShell>
      <PageHeader title="Super Admin Dashboard" />
      <EmptyState title="Nothing here yet" />
    </PageShell>
  );
}
