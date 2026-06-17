import { areas, notices, pages } from "@/content/portal";
import { LoginForm } from "@/components/auth/LoginForm";

export default function AdminLoginPage() {
  return (
    <LoginForm
      areaLabel={areas.admin}
      title={pages.signIn}
      emailLabel="Email"
      emailPlaceholder="admin@energeticexotics.com"
      submitHref="/admin/dashboard"
      secureNotice={notices.adminSignIn}
    />
  );
}
