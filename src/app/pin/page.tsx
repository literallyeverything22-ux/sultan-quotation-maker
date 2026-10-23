import { redirect } from "next/navigation";
import { PinPad } from "@/components/PinPad";
import { getSessionFromCookies } from "@/lib/auth/session";

interface PinPageProps {
  searchParams: Promise<{ mode?: string; next?: string }>;
}

export default async function PinPage({ searchParams }: PinPageProps) {
  const resolved = await searchParams;
  const mode = resolved.mode === "owner" ? "owner" : "staff";
  const redirectTo =
    typeof resolved.next === "string" && resolved.next.startsWith("/")
      ? resolved.next
      : mode === "owner"
        ? "/settings"
        : "/";

  const session = await getSessionFromCookies();
  if (mode === "owner" && session?.role === "owner") {
    redirect(redirectTo);
  }
  if (mode === "staff" && session) {
    redirect(redirectTo);
  }

  return <PinPad mode={mode} redirectTo={redirectTo} />;
}
