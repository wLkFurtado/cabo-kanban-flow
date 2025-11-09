// Confirma em massa usuários com email pendente, usando a Service Role Key
// Uso: node confirm-all-pending-users.mjs [perPage]

import { createClient } from "@supabase/supabase-js";

const perPage = Number(process.argv[2] || 200);

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Defina SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

(async () => {
  let page = 1;
  let totalConfirmed = 0;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Erro ao listar usuários:", error.message);
      process.exit(1);
    }
    const users = data?.users || [];
    if (users.length === 0) break;

    for (const user of users) {
      if (!user.email_confirmed_at) {
        const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
          email_confirmed_at: new Date().toISOString(),
        });
        if (updateErr) {
          console.warn(`Falha ao confirmar ${user.email}:`, updateErr.message);
        } else {
          totalConfirmed++;
          console.log(`Confirmado: ${user.email}`);
        }
      }
    }

    page++;
  }

  console.log(`Total confirmados: ${totalConfirmed}`);
})();