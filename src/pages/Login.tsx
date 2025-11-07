import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Seo } from "@/components/seo/Seo";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  async function onSubmit(values: FormValues) {
    try {
      const { error } = await signIn(values.email, values.password);
      
      if (error) {
        console.error('Login error:', error);
        
        // Provide more specific error messages
        let errorMessage = "Credenciais inválidas. Verifique seu e-mail e senha.";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "E-mail ou senha incorretos. Verifique os dados informados.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Por favor, confirme seu e-mail antes de fazer login.";
        } else if (error.message.includes('Too many requests')) {
          errorMessage = "Muitas tentativas de login. Tente novamente em alguns minutos.";
        }
        
        toast({ 
          title: "Erro ao entrar", 
          description: errorMessage,
          variant: "destructive" 
        });
        return;
      }
      
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      navigate("/");
    } catch (e: unknown) {
      console.error('Unexpected login error:', e);
      toast({ 
        title: "Erro inesperado", 
        description: "Ocorreu um erro inesperado. Tente novamente.", 
        variant: "destructive" 
      });
    }
  }

  return (
    <main className="container mx-auto max-w-md py-10">
      <Seo title="Entrar | Comunicação Cabo Frio" description="Acesse sua conta com e-mail e senha." />
      <div className="mb-6 flex justify-center">
        <img
          src="https://ankliiywmcpncymdlvaa.supabase.co/storage/v1/object/sign/images/marca-horizontal-colorida2.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80YzhjY2FlYS1lYTVkLTRiMzYtOWJiZS03NmRkYmRkNjhlYTUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvbWFyY2EtaG9yaXpvbnRhbC1jb2xvcmlkYTIucG5nIiwiaWF0IjoxNzYwNjUzNzcyLCJleHAiOjE5MTgzMzM3NzJ9.NzLnTCYxbAqS7H9JOsTaBL6kLME6tRpklss2R5rVuh0"
          alt="Logo Coordenadoria de Comunicação"
          className="h-28 sm:h-32 md:h-36 max-w-full object-contain select-none"
          draggable={false}
        />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="seu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Sua senha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
      </Form>

      <p className="mt-4 text-sm text-muted-foreground">
        Não tem uma conta? <Link to="/register" className="underline">Cadastre-se</Link>
      </p>
    </main>
  );
}
