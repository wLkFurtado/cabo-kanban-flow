import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    // This gives us admin privileges to delete users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Verify the user making the request is authenticated
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if the user has admin role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError || userRole?.role !== "admin") {
      return new Response(
        JSON.stringify({
          error:
            "Acesso negado. Apenas administradores podem excluir usuários.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the user ID to delete from the request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "ID do usuário não fornecido" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode excluir sua própria conta" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("🗑️ Admin iniciando exclusão do usuário:", userId);

    // Delete the user from auth.users
    // This will cascade delete to profiles and all related tables
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("❌ Erro ao excluir usuário:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Erro ao excluir usuário",
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      "✅ Usuário excluído com sucesso. Cascade deletou todos os dados relacionados.",
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário excluído com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("❌ Erro inesperado:", error);
    return new Response(
      JSON.stringify({
        error: "Erro inesperado ao excluir usuário",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
