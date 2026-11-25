import { supabase } from "@/lib/supabase";

type AuthenticatedIdentity = {
  id: string;
  email?: string | null;
};

type MembershipProfile = {
  id: string;
  email: string;
  is_booster?: boolean | null;
  is_mfo?: boolean | null;
  display_name?: string | null;
  link_afiliado?: string | null;
};

export function normalizeMembershipEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export async function loadMembershipProfile(user: AuthenticatedIdentity | null) {
  const email = normalizeMembershipEmail(user?.email);

  if (!user?.id || !email || !supabase) {
    return {
      profile: null,
      isSocio: hasPreviewBoosterAccess(),
      isMfo: false,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, is_booster, is_mfo, display_name, link_afiliado")
    .eq("email", email)
    .eq("id", user.id)
    .maybeSingle();

  const profile =
    !error &&
    data?.id === user.id &&
    normalizeMembershipEmail(data?.email) === email
      ? (data as MembershipProfile)
      : null;

  return {
    profile,
    isSocio: profile?.is_booster === true || hasPreviewBoosterAccess(),
    isMfo: profile?.is_mfo === true,
  };
}

export function hasPreviewBoosterAccess() {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "poderdaconsciencia.zenly.cloud") return false;

  // The Preview may open as its own page instead of inside the editor frame.
  if (hostname === "zenly.cloud" || hostname.endsWith(".zenly.cloud")) return true;
  if (window.self === window.top) return false;

  return Array.from(window.location.ancestorOrigins ?? []).some((origin) => {
    try {
      const ancestorHostname = new URL(origin).hostname.toLowerCase();
      return ancestorHostname === "zenly.cloud" || ancestorHostname.endsWith(".zenly.cloud");
    } catch {
      return false;
    }
  });
}