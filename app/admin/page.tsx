import type { Metadata } from "next";
import { BuilderAdminPage } from "@/components/admin/builder-admin-page";

export const metadata: Metadata = { title: "Builder control plane | Chusky", robots: { index: false, follow: false } };
export default function AdminPage() { return <BuilderAdminPage />; }
