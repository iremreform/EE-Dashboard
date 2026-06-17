import { areas, notices, pages } from "@/content/portal";
import { LoginForm } from "@/components/auth/LoginForm";

export default function DriverLoginPage() {
  return (
    <LoginForm
      areaLabel={areas.driver}
      title={pages.signIn}
      emailLabel="Email / username"
      emailPlaceholder="email@example.com"
      submitHref="/driver/dashboard"
      secureNotice={notices.driverSignIn}
      helpHref="/driver/forgot-password"
      helpLabel="Need help signing in?"
    />
  );
}
