import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "student" | "college" | "industry" | "admin";

/**
 * Ensures the signed-in user has a profile row, a role row and the entity that
 * matches their role (student / college / company). Auth-schema triggers are not
 * available, so provisioning happens here on first authenticated load.
 */
export const provisionAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const uid = context.userId;

    const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(uid);
    const user = userRes?.user;
    if (!user) return { ok: false as const };

    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
    const email = user.email ?? "";
    const fullName = meta["full_name"] ?? "";
    const role = ((meta["role"] as Role | undefined) ?? "student") satisfies Role;

    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: uid,
          full_name: fullName,
          email,
          phone: meta["phone"] ?? null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );

    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();

    const effectiveRole = (existingRole?.role as Role | undefined) ?? role;
    if (!existingRole) {
      await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: effectiveRole });
    }

    if (effectiveRole === "student") {
      const { data: student } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (!student) {
        const interests = (meta["interests"] ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        await supabaseAdmin.from("students").insert({
          user_id: uid,
          full_name: fullName || email,
          email,
          phone: meta["phone"] ?? null,
          department: meta["department"] || "Computer Science",
          degree: meta["degree"] || "B.Tech",
          year: Number(meta["year"]) || 3,
          graduation_year: Number(meta["graduation_year"]) || new Date().getFullYear() + 1,
          location: meta["location"] ?? "",
          interests,
          target_role: meta["target_role"] || "Full Stack Developer",
        });
      }
    } else if (effectiveRole === "college") {
      const { data: college } = await supabaseAdmin
        .from("colleges")
        .select("id")
        .eq("owner_id", uid)
        .maybeSingle();
      if (!college) {
        await supabaseAdmin.from("colleges").insert({
          name: meta["institution"] || "New Institution",
          institution_type: meta["institution_type"] || "Engineering College",
          location: meta["location"] ?? "",
          contact_person: fullName || null,
          official_email: meta["official_email"] || email,
          website: meta["website"] || null,
          owner_id: uid,
        });
      }
    } else if (effectiveRole === "industry") {
      const { data: company } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("owner_id", uid)
        .maybeSingle();
      if (!company) {
        await supabaseAdmin.from("companies").insert({
          name: meta["company"] || "New Company",
          sector: meta["sector"] || "Information Technology",
          company_size: meta["company_size"] || "51-200",
          location: meta["location"] ?? "",
          recruiter_name: fullName || null,
          recruiter_email: email,
          website: meta["website"] || null,
          owner_id: uid,
        });
      }
    }

    return { ok: true as const, role: effectiveRole };
  });
