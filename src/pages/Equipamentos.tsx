import React, { useState } from 'react';
import { useEquipments } from '@/hooks/useEquipments';
import { useEquipmentLoans } from '@/hooks/useEquipmentLoans';
import { useEquipmentScope } from '@/hooks/useEquipmentScope';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { EquipmentModal } from '@/components/equipments/EquipmentModal';
import { EquipmentCard } from '@/components/equipments/EquipmentCard';
import { LoanModal } from '@/components/equipments/LoanModal';
import { LoanHistoryModal } from '@/components/equipments/LoanHistoryModal';
import { ReturnConfirmDialog } from '@/components/equipments/ReturnConfirmDialog';
import type { EquipmentWithActiveLoan } from '@/state/equipmentTypes';

export default function Equipamentos() {
  const { equipments, loading } = useEquipments();
  const { returnEquipment, isReturning } = useEquipmentLoans();
  const { hasEquipmentScope } = useEquipmentScope();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentWithActiveLoan | null>(null);

  // Filtrar equipamentos
  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || equipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (equipment: EquipmentWithActiveLoan) => {
    setSelectedEquipment(equipment);
    setEquipmentModalOpen(true);
  };

  const handleLoan = (equipment: EquipmentWithActiveLoan) => {
    setSelectedEquipment(equipment);
    setLoanModalOpen(true);
  };

  const [returningEquipmentId, setReturningEquipmentId] = useState<string | null>(null);

  const handleReturn = (equipment: EquipmentWithActiveLoan) => {
    setSelectedEquipment(equipment);
    setReturnDialogOpen(true);
  };

  const confirmReturn = async () => {
    if (!selectedEquipment?.active_loan) return;
    
    setReturningEquipmentId(selectedEquipment.id);
    try {
      await returnEquipment(selectedEquipment.active_loan.id);
      setReturnDialogOpen(false);
    } finally {
      setReturningEquipmentId(null);
    }
  };

  const handleViewHistory = (equipment: EquipmentWithActiveLoan) => {
    setSelectedEquipment(equipment);
    setHistoryModalOpen(true);
  };

  const handleCloseModals = () => {
    setEquipmentModalOpen(false);
    setLoanModalOpen(false);
    setHistoryModalOpen(false);
    setReturnDialogOpen(false);
    setSelectedEquipment(null);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Equipamentos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie equipamentos e empréstimos
            </p>
          </div>
          {hasEquipmentScope && (
            <Button onClick={() => setEquipmentModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Equipamento
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por nome, modelo ou número de série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="emprestado">Emprestado</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </div>

      {/* Lista de Equipamentos */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando equipamentos...</div>
        ) : filteredEquipments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Nenhum equipamento encontrado com os filtros aplicados.'
              : 'Nenhum equipamento cadastrado ainda.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEquipments.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                canManage={hasEquipmentScope}
                onEdit={() => handleEdit(equipment)}
                onLoan={() => handleLoan(equipment)}
                onReturn={() => handleReturn(equipment)}
                onViewHistory={() => handleViewHistory(equipment)}
                isReturning={returningEquipmentId === equipment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <EquipmentModal
        open={equipmentModalOpen}
        onClose={handleCloseModals}
        equipment={selectedEquipment}
      />
      
      <LoanModal
        open={loanModalOpen}
        onClose={handleCloseModals}
        equipment={selectedEquipment}
      />
      
      <LoanHistoryModal
        open={historyModalOpen}
        onClose={handleCloseModals}
        equipment={selectedEquipment}
      />
      
      <ReturnConfirmDialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        onConfirm={confirmReturn}
        equipment={selectedEquipment}
        isReturning={returningEquipmentId === selectedEquipment?.id}
      />
    </div>
  );
}
