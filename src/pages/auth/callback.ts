import type { APIRoute } from "astro";
import { supabase } from "@lib/supabase";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
    const authCode = url.searchParams.get("code");

    if (!authCode) {
        return redirect("/auth/login?error=No code provided");
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

    if (error) {
        console.error("Auth callback error:", error);
        return redirect("/auth/login?error=Authentication failed");
    }

    const { session } = data;
    const { access_token, refresh_token } = session;

    cookies.set("sb-access-token", access_token, {
        path: "/",
        sameSite: "lax",
        secure: import.meta.env.PROD,
    });

    cookies.set("sb-refresh-token", refresh_token, {
        path: "/",
        sameSite: "lax",
        secure: import.meta.env.PROD,
    });

    return redirect("/account/profile");
};
