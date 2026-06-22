import { areas, homeChoices, pages } from "@/content/portal";
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
          description={homeChoices.driver.description}
          actionLabel={pages.signIn}
        />

        <ChoiceCard
          href="/admin/login"
          title={areas.admin}
          description={homeChoices.admin.description}
          actionLabel={pages.signIn}
        />
      </ChoiceGrid>
    </PageShell>
  );
}
