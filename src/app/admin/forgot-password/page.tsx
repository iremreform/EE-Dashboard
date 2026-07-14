import { AdminPasswordRecoveryForm } from "@/components/auth/AdminPasswordRecoveryForm";

type AdminForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function AdminForgotPasswordPage({
  searchParams,
}: AdminForgotPasswordPageProps) {
  const { error } = await (searchParams ?? Promise.resolve({} as { error?: string }));

  return <AdminPasswordRecoveryForm initialError={error} />;
}
