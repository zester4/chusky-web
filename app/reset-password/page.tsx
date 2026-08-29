import type { Metadata } from "next";
import { AuthPage } from "@/components/landing/auth-pages";

export const metadata: Metadata = { title: "Choose a new password | Chusky AI Agent", description: "Set a new password for your Chusky account." };

export default function ResetPasswordPage() { return <AuthPage variant="reset-password" />; }
