import { areas, notices, pages } from "@/content/portal";
import { LoginForm } from "@/components/auth/LoginForm";
import { adminLoginAction } from "./actions";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { error } = await (searchParams ?? Promise.resolve({} as { error?: string }));

  return (
    <LoginForm
      areaLabel={areas.admin}
      title={pages.signIn}
      emailLabel="Email"
      emailPlaceholder="admin@energeticexotics.com"
      error={error}
      formAction={adminLoginAction}
      submitHref="/admin/dashboard"
      secureNotice={notices.adminSignIn}
    />
  );
}
