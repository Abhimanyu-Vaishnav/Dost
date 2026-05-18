import { AuthForm } from "@/features/auth/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="main-content">
      <AuthForm mode="register" />
    </main>
  );
}
