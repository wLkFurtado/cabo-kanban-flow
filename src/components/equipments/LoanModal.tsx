import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEquipmentLoans } from '@/hooks/useEquipmentLoans';
import { useProfiles } from '@/hooks/useProfiles';
import type { Equipment } from '@/state/equipmentTypes';
import { ChevronDown, User } from 'lucide-react';

interface LoanModalProps {
  open: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
}

export function LoanModal({ open, onClose, equipment }: LoanModalProps) {
  const { loanEquipment, isLoaning } = useEquipmentLoans();
  const { profiles } = useProfiles();
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrar perfis baseado na busca
  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower) ||
      profile.display_name?.toLowerCase().includes(searchLower)
    );
  });

  // Encontrar usuário selecionado
  const selectedUser = profiles.find(p => p.id === selectedUserId);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedUserId('');
    setNotes('');
    setError('');
    setSearchTerm('');
    setIsDropdownOpen(false);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipment) return;
    
    if (!selectedUserId) {
      setError('Selecione um usuário');
      return;
    }

    loanEquipment({
      equipment_id: equipment.id,
      user_id: selectedUserId,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setError('');
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Emprestar Equipamento</DialogTitle>
        </DialogHeader>

        {equipment && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {equipment.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {equipment.model} • {equipment.serial_number}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de usuário com dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Label htmlFor="user-search">Usuário *</Label>
            
            {/* Campo de seleção/busca */}
            <div className="relative">
              <Input
                id="user-search"
                type="text"
                placeholder={selectedUser ? '' : "Clique para selecionar um usuário..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="pr-10"
              />
              
              {/* Mostrar usuário selecionado quando não está buscando */}
              {selectedUser && !searchTerm && !isDropdownOpen && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {selectedUser.full_name}
                  </span>
                </div>
              )}
              
              {/* Ícone de dropdown */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {/* Dropdown com lista de usuários */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-800">
                {filteredProfiles.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
                  </div>
                ) : (
                  filteredProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => handleSelectUser(profile.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 ${
                        selectedUserId === profile.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {profile.full_name || profile.display_name || 'Sem nome'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {profile.email}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre o empréstimo..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoaning}>
              {isLoaning ? 'Emprestando...' : 'Confirmar Empréstimo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
