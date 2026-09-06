import type { Metadata } from "next";
import { AuthPage } from "@/components/landing/auth-pages";

export const metadata: Metadata = { title: "Create an account | Chusky AI Agent", description: "Create your secure Chusky workspace." };

export default function SignUpPage() { return <AuthPage variant="sign-up" />; }
