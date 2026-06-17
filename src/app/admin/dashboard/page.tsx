import { areas, nav } from "@/content/portal";
import { DashboardPlaceholder } from "@/components/layout/DashboardPlaceholder";

export default function AdminDashboardPage() {
  return (
    <DashboardPlaceholder
      areaLabel={areas.admin}
      greeting="Hello, Jordan Blake"
      lead="Review submissions, manage drivers, and monitor alerts."
      backHref="/admin/login"
      backLabel={nav.logout}
    />
  );
}
