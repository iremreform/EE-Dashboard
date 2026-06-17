import { areas, pages } from "@/content/portal";
import { ChoiceCard } from "@/components/ui";
import { ChoiceGrid, PageIntro, PageShell } from "@/components/layout";

export default function HomePage() {
  return (
    <PageShell
      centerContent
      width="default"
    >
      <PageIntro tagline={pages.homeTagline} title={pages.homeTitle} centered />

      <ChoiceGrid>
        <ChoiceCard
          href="/driver/login"
          title={areas.driver}
          description="Delivery check-in, pickup / return, and submissions."
          actionLabel={pages.signIn}
        />

        <ChoiceCard
          href="/admin/login"
          title={areas.admin}
          description="Driver management, submission review, and alerts."
          actionLabel={pages.signIn}
        />
      </ChoiceGrid>
    </PageShell>
  );
}
