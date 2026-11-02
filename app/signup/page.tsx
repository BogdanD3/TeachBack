import { redirect } from "next/navigation";

// Short referral link: /signup?ref=CODE → /auth/signup?ref=CODE
export default async function SignupAlias({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  redirect(ref ? `/auth/signup?ref=${encodeURIComponent(ref)}` : "/auth/signup");
}
