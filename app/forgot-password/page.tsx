import type { Metadata } from "next";
import { AuthPage } from "@/components/landing/auth-pages";

export const metadata: Metadata = { title: "Reset your password | Chusky AI Agent", description: "Securely recover your Chusky account." };

export default function ForgotPasswordPage() { return <AuthPage variant="forgot-password" />; }
