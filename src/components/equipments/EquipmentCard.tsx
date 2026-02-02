import React from 'react';
import { Clock, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EquipmentWithActiveLoan } from '@/state/equipmentTypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EquipmentCardProps {
  equipment: EquipmentWithActiveLoan;
  canManage: boolean;
  onEdit: () => void;
  onLoan: () => void;
  onReturn: () => void;
  onViewHistory: () => void;
  isReturning: boolean;
}

const statusConfig = {
  disponivel: { label: 'Disponível', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  emprestado: { label: 'Emprestado', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  manutencao: { label: 'Manutenção', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
};

export function EquipmentCard({ 
  equipment, 
  canManage,
  onEdit, 
  onLoan, 
  onReturn, 
  onViewHistory,
  isReturning
}: EquipmentCardProps) {
  const status = statusConfig[equipment.status];
  const isLoanedOut = equipment.status === 'emprestado' && equipment.active_loan;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${status.bgColor}`}>
            <Package className={`w-5 h-5 ${status.textColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {equipment.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {equipment.model}
            </p>
          </div>
        </div>
        <Badge className={status.bgColor + ' ' + status.textColor + ' border-0'}>
          {status.label}
        </Badge>
      </div>

      {/* Serial Number */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          Número de Série
        </p>
        <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
          {equipment.serial_number}
        </p>
      </div>

      {/* Active Loan Info */}
      {isLoanedOut && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {equipment.active_loan?.user?.full_name || 'Usuário não encontrado'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>
              Desde {format(new Date(equipment.active_loan.loaned_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          {equipment.active_loan.notes && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 italic">
              "{equipment.active_loan.notes}"
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {equipment.status === 'disponivel' && canManage && (
          <Button onClick={onLoan} variant="default" size="sm" className="w-full">
            Emprestar
          </Button>
        )}
        
        {isLoanedOut && canManage && (
          <Button 
            onClick={onReturn} 
            variant="outline" 
            size="sm" 
            className="w-full"
            disabled={isReturning}
          >
            {isReturning ? 'Devolvendo...' : 'Devolver'}
          </Button>
        )}
        
        <div className="flex gap-2">
          <Button onClick={onViewHistory} variant="ghost" size="sm" className="flex-1">
            Histórico
          </Button>
          {canManage && (
            <Button onClick={onEdit} variant="ghost" size="sm" className="flex-1">
              Editar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
