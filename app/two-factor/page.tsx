import type { Metadata } from "next";
import { TwoFactorPage } from "@/components/admin/two-factor-page";
export const metadata: Metadata = { title: "Verify sign-in | Chusky", robots: { index: false, follow: false } };
export default function Page() { return <TwoFactorPage />; }
