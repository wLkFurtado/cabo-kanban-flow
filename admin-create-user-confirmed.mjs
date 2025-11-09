// Cria um usuário já confirmado (sem enviar e-mail), usando a Service Role Key
// Uso: node admin-create-user-confirmed.mjs <email> <password> [full_name] [cargo]

import { createClient } from "@supabase/supabase-js";

const [,, email, password, full_name = "", cargo = ""] = process.argv;

if (!email || !password) {
  console.error("Uso: node admin-create-user-confirmed.mjs <email> <password> [full_name] [cargo]");
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

(async () => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // autoconfirma sem enviar e-mail
    user_metadata: {
      full_name,
      cargo,
      role: "user",
    },
  });

  if (error) {
    console.error("Erro ao criar usuário confirmado:", error.message);
    process.exit(1);
  }

  console.log("Usuário criado e confirmado:", {
    id: data.user?.id,
    email: data.user?.email,
    email_confirmed_at: data.user?.email_confirmed_at,
  });
})();