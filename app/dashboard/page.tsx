import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  return (
    <div className="gutter mx-auto max-w-content py-12">
      <h1 className="t-h1">Hi, {user.name.split(" ")[0]}</h1>
    </div>
  );
}
