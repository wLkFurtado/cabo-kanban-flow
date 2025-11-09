import { useForm } from "react-hook-form";
import type { ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Seo } from "../components/seo/Seo";

const schema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(8, "Informe um telefone válido"),
    role: z.string().min(2, "Informe seu cargo"),
    password: z.string().min(6, "Mínimo de 6 caracteres"),
    confirmPassword: z.string().min(6, "Mínimo de 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const CARGOS = [
    "Filmmaker / Editor",
    "Fotógrafo",
    "Jornalista",
    "Rede",
    "Administrativo",
    "Coordenador",
  ] as const;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", role: "", password: "", confirmPassword: "" },
  });
  const { signUp, user } = useAuth();
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
      const { error } = await signUp(values.email, values.password, {
        full_name: values.name,
        phone: values.phone,
        cargo: values.role, // Passando o cargo preenchido pelo usuário
        role: 'user', // Role padrão para novos usuários
      });
      
      if (error) {
        throw error;
      }
      
      toast({ 
        title: "Conta criada!", 
        description: "Sua conta foi criada com sucesso. Verifique seu email para confirmar." 
      });
      navigate("/login");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Erro interno. Tente novamente.";
      toast({ 
        title: "Erro ao cadastrar", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  }

  return (
    <main className="container mx-auto max-w-md py-10">
      <Seo title="Cadastrar | Comunicação Cabo Frio" description="Crie sua conta informando nome, e-mail, cargo e telefone." />
      <h1 className="text-2xl font-semibold mb-6">Cadastrar</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }: { field: ControllerRenderProps<FormValues, "name"> }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: ControllerRenderProps<FormValues, "email"> }) => (
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
            name="role"
            render={({ field }: { field: ControllerRenderProps<FormValues, "role"> }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu cargo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CARGOS.map((cargo) => (
                      <SelectItem key={cargo} value={cargo}>
                        {cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }: { field: ControllerRenderProps<FormValues, "phone"> }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(22) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }: { field: ControllerRenderProps<FormValues, "password"> }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Crie uma senha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }: { field: ControllerRenderProps<FormValues, "confirmPassword"> }) => (
              <FormItem>
                <FormLabel>Confirmar senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Repita a senha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">Criar conta</Button>
        </form>
      </Form>

      <p className="mt-4 text-sm text-muted-foreground">
        Já tem uma conta? <Link to="/login" className="underline">Entrar</Link>
      </p>
    </main>
  );
}
