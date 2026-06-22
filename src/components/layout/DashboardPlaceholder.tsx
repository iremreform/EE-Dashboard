import { Button } from "@/components/ui";
import { nav, pages } from "@/content/portal";
import { PageIntro, PageShell } from "@/components/layout";
import contentStyles from "./PageContent.module.css";

type DashboardPlaceholderProps = {
  areaLabel: string;
  greeting: string;
  lead: string;
  backHref: string;
  backLabel: string;
};

export function DashboardPlaceholder({
  areaLabel,
  greeting,
  lead,
  backHref,
  backLabel,
}: DashboardPlaceholderProps) {
  return (
    <PageShell backHref={backHref} backLabel={backLabel} width="default">
      <PageIntro tagline={areaLabel} title={greeting} lead={lead} />

      <p className={contentStyles.bodyCopy}>{pages.placeholderBody}</p>

      <div className={contentStyles.pageActions}>
        <Button href={backHref} variant="secondary">
          Back to {nav.login.toLowerCase()}
        </Button>
      </div>
    </PageShell>
  );
}
