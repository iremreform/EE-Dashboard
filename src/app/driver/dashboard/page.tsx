import { areas, nav } from "@/content/portal";
import { DashboardPlaceholder } from "@/components/layout/DashboardPlaceholder";

export default function DriverDashboardPage() {
  return (
    <DashboardPlaceholder
      areaLabel={areas.driver}
      greeting="Hello, John Davis"
      lead="Choose a workflow to start a vehicle check-in or return."
      backHref="/driver/login"
      backLabel={nav.logout}
    />
  );
}
