import { useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Search, Users, Edit, Trash2, Plus, Mail, Phone, Briefcase } from "lucide-react";
import { useProfiles, type Profile } from "../hooks/useProfiles";
import { EditContactDialog } from "../components/admin/EditContactDialog";
import { AddContactDialog } from "../components/admin/AddContactDialog";
import { useAdminRole } from "../hooks/useAdminRole";
import { getInitials } from "@/lib/utils";
import { Seo } from "../components/seo/Seo";
import { formatPhoneBR } from "../lib/utils";

export default function Contacts() {
  const { profiles, loading, deleteProfile } = useProfiles();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { isAdmin } = useAdminRole();

  const filteredProfiles = profiles.filter((profile: Profile) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower) ||
      profile.phone?.toLowerCase().includes(searchLower) ||
      profile.cargo?.toLowerCase().includes(searchLower) ||
      profile.display_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleEditContact = (contact: Profile) => {
    setSelectedContact(contact);
    setEditDialogOpen(true);
  };

  const handleDeleteContact = async (contact: Profile) => {
    await deleteProfile(contact.id);
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'user':
        return 'default';
      case 'guest':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'user':
        return 'Usuário';
      case 'guest':
        return 'Convidado';
      default:
        return 'Não definido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Seo 
        title="Contatos"
        description="Lista de contatos e usuários do sistema"
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contatos</h1>
            <p className="text-muted-foreground">
              Visualize todos os contatos do sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">{profiles.length} contatos</span>
            </div>
            {isAdmin && (
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Contatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone ou cargo..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contatos ({filteredProfiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Criado em</TableHead>
                    {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8">
                        {searchTerm ? "Nenhum contato encontrado" : "Nenhum contato cadastrado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((profile: Profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>
                                {getInitials(profile.full_name || profile.display_name || profile.email || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {profile.full_name || profile.display_name || "Sem nome"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {profile.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {profile.phone && (
                              <div>{formatPhoneBR(profile.phone) || profile.phone}</div>
                            )}
                            {profile.display_name && profile.display_name !== profile.full_name && (
                              <div className="text-muted-foreground">
                                Exibição: {profile.display_name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {profile.cargo || "Não informado"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(profile.role)}>
                            {getRoleLabel(profile.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {profile.created_at ? 
                            new Date(profile.created_at).toLocaleDateString('pt-BR') : 
                            "Não informado"
                          }
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditContact(profile)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir contato</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o contato de{" "}
                                      <strong>{profile.full_name || profile.email}</strong>?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteContact(profile)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <EditContactDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          contact={selectedContact}
        />

        <AddContactDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      </div>
    </>
  );
}