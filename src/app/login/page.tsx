import { AuthForm } from "@/features/auth/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="main-content">
      <AuthForm mode="login" />
    </main>
  );
}
