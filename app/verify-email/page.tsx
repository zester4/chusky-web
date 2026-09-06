import type { Metadata } from "next";
import { AuthPage } from "@/components/landing/auth-pages";

export const metadata: Metadata = { title: "Verify your email | Chusky AI Agent", description: "Verify your email to finish setting up Chusky." };

export default function VerifyEmailPage() { return <AuthPage variant="verify-email" />; }
