import type { Metadata } from "next";
import { AuthPage } from "@/components/landing/auth-pages";

export const metadata: Metadata = {
  title: "Sign in | Chusky AI Agent",
  description: "Sign in to continue working with Chusky across Telegram, your connected apps, and linked terminal.",
};

export default function SignInPage() {
  return <AuthPage variant="sign-in" />;
}
