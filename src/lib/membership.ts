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
    return { profile: null, isSocio: false, isMfo: false };
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
    isSocio: profile?.is_booster === true,
    isMfo: profile?.is_mfo === true,
  };
}