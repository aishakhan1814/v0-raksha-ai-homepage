import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("raksha_token")?.value;

  if (!token) {
    redirect("/signin?redirect=/admin");
  }

  try {
    const user = verifyJWT(token);
    if (user.role !== "coordinator") {
      redirect("/signin?error=forbidden");
    }
  } catch {
    redirect("/signin?redirect=/admin");
  }

  return <>{children}</>;
}
