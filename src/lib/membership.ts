import { supabase } from "@/lib/supabase";

export const MODO_TESTE_SOCIO = true;

type AuthenticatedIdentity = {
  id: string;
  email?: string | null;
};

export function normalizeMembershipEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? "";
}

export async function loadMembershipProfile(user: AuthenticatedIdentity | null) {
  const email = normalizeMembershipEmail(user?.email);

  if (!user || !email) {
    return { profile: null, isSocio: false };
  }

  if (!supabase) {
    return { profile: null, isSocio: MODO_TESTE_SOCIO };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, is_booster, has_mfo, display_name, link_afiliado")
    .eq("email", email)
    .eq("id", user.id)
    .maybeSingle();

  const profile =
    !error &&
    data?.id === user.id &&
    normalizeMembershipEmail(data?.email) === email
      ? data
      : null;

  return {
    profile,
    isSocio: MODO_TESTE_SOCIO || profile?.is_booster === true,
  };
}