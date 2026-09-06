import type { Metadata } from "next";
import { AuthPage } from "@/components/landing/auth-pages";

export const metadata: Metadata = {
  title: "Email verified | Chusky AI Agent",
  description: "Your Chusky email has been verified successfully.",
};

export default function EmailVerifiedPage() {
  return <AuthPage variant="email-verified" />;
}
