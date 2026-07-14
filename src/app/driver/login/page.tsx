import { areas, pages } from "@/content/portal";
import { LoginForm } from "@/components/auth/LoginForm";
import { driverLoginAction } from "./actions";

type DriverLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function DriverLoginPage({ searchParams }: DriverLoginPageProps) {
  const { error } = await (searchParams ?? Promise.resolve({} as { error?: string }));

  return (
    <LoginForm
      areaLabel={areas.driver}
      title={pages.signIn}
      emailLabel="Email / username"
      emailPlaceholder="email@example.com"
      error={error}
      formAction={driverLoginAction}
      submitHref="/driver/dashboard"
      helpHref="/driver/forgot-password"
      helpLabel="Need help signing in?"
    />
  );
}
