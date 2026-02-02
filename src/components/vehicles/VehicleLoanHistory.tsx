import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVehicleLoans } from '@/hooks/useVehicleLoans';
import type { Vehicle } from '@/state/vehicleTypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, CheckCircle, Gauge } from 'lucide-react';

interface VehicleLoanHistoryProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
}

export function VehicleLoanHistory({ open, onClose, vehicle }: VehicleLoanHistoryProps) {
  const { getLoanHistory } = useVehicleLoans();

  const history = vehicle ? getLoanHistory(vehicle.id) : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Empréstimos</DialogTitle>
        </DialogHeader>

        {vehicle && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {vehicle.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {vehicle.model} • {vehicle.plate}
            </p>
          </div>
        )}

        <div className="overflow-y-auto max-h-[50vh]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum empréstimo registrado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((loan) => {
                const isActive = !loan.returned_at;
                const kmRodado = loan.km_final ? loan.km_final - loan.km_inicial : null;
                
                return (
                  <div
                    key={loan.id}
                    className={`p-4 rounded-lg border ${
                      isActive
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Usuário */}
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {loan.user?.full_name || 'Usuário não encontrado'}
                      </p>
                      {isActive && (
                        <span className="ml-auto text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                          Em uso
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {loan.user?.email}
                    </p>

                    {/* Quilometragem */}
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-3">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Gauge className="w-3 h-3 text-blue-500" />
                        <span className="font-medium">KM Inicial:</span>
                        <span>{loan.km_inicial.toLocaleString('pt-BR')} km</span>
                      </div>
                      
                      {loan.km_final && (
                        <>
                          <div className="flex items-center gap-2 text-sm mb-1">
                            <Gauge className="w-3 h-3 text-green-500" />
                            <span className="font-medium">KM Final:</span>
                            <span>{loan.km_final.toLocaleString('pt-BR')} km</span>
                          </div>
                          
                          {kmRodado !== null && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400">
                              <span>→</span>
                              <span>KM Rodado: {kmRodado.toLocaleString('pt-BR')} km</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Data de quando pegou */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Pegou em {format(new Date(loan.loaned_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Data de devolução */}
                    {loan.returned_at && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-2">
                        <CheckCircle className="w-3 h-3" />
                        <span>
                          Devolvido em {format(new Date(loan.returned_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    )}

                    {/* Quem pegou (admin que processou) */}
                    {loan.loaned_by_user && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Registrado por: {loan.loaned_by_user.full_name}
                      </p>
                    )}

                    {/* Quem devolveu */}
                    {loan.returned_by_user && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Devolvido por: {loan.returned_by_user.full_name}
                      </p>
                    )}

                    {/* Observações */}
                    {loan.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Observações:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                          "{loan.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
