import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Car as CarIcon } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useVehicleScope } from '@/hooks/useVehicleScope';
import { VehicleModal } from '@/components/vehicles/VehicleModal';
import { VehicleLoanModal } from '@/components/vehicles/VehicleLoanModal';
import { VehicleReturnModal } from '@/components/vehicles/VehicleReturnModal';
import { VehicleLoanHistory } from '@/components/vehicles/VehicleLoanHistory';
import type { Vehicle, VehicleWithActiveLoan } from '@/state/vehicleTypes';

export default function Carros() {
  const { vehicles, isLoading } = useVehicles();
  const { hasVehicleScope } = useVehicleScope();

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [vehicleToLoan, setVehicleToLoan] = useState<Vehicle | null>(null);
  
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [vehicleToReturn, setVehicleToReturn] = useState<VehicleWithActiveLoan | null>(null);
  
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [vehicleForHistory, setVehicleForHistory] = useState<Vehicle | null>(null);

  const handleNewVehicle = () => {
    setSelectedVehicle(null);
    setVehicleModalOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleModalOpen(true);
  };

  const handleLoanVehicle = (vehicle: Vehicle) => {
    setVehicleToLoan(vehicle);
    setLoanModalOpen(true);
  };

  const handleReturnVehicle = (vehicle: VehicleWithActiveLoan) => {
    setVehicleToReturn(vehicle);
    setReturnModalOpen(true);
  };

  const handleShowHistory = (vehicle: Vehicle) => {
    setVehicleForHistory(vehicle);
    setHistoryModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponivel: { label: 'Disponível', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      emprestado: { label: 'Emprestado', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      manutencao: { label: 'Manutenção', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disponivel;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando carros...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Carros
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os carros da empresa
          </p>
        </div>
        
        {hasVehicleScope && (
          <Button onClick={handleNewVehicle}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Carro
          </Button>
        )}
      </div>

      {/* Lista de Carros */}
      {vehicles.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Nenhum carro cadastrado ainda.</p>
          {hasVehicleScope && (
            <Button onClick={handleNewVehicle} className="mt-4">
              Cadastrar Primeiro Carro
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
            >
              {/* Cabeçalho do Card */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {vehicle.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {vehicle.model}
                  </p>
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-500 mt-1">
                    {vehicle.plate}
                  </p>
                </div>
                {getStatusBadge(vehicle.status)}
              </div>

              {/* Info de quem está com o carro */}
              {vehicle.active_loan && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Em uso por:
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {vehicle.active_loan.user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    KM: {vehicle.active_loan.km_inicial.toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-2 flex-wrap">
                {hasVehicleScope && (
                  <>
                    {vehicle.status === 'disponivel' && (
                      <Button
                        size="sm"
                        onClick={() => handleLoanVehicle(vehicle)}
                      >
                        Pegar
                      </Button>
                    )}
                    
                    {vehicle.status === 'emprestado' && vehicle.active_loan && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReturnVehicle(vehicle)}
                      >
                        Devolver
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      Editar
                    </Button>
                  </>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleShowHistory(vehicle)}
                >
                  Histórico
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <VehicleModal
        open={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        vehicle={selectedVehicle}
      />
      
      <VehicleLoanModal
        open={loanModalOpen}
        onClose={() => setLoanModalOpen(false)}
        vehicle={vehicleToLoan}
      />
      
      <VehicleReturnModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        vehicle={vehicleToReturn}
      />
      
      <VehicleLoanHistory
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        vehicle={vehicleForHistory}
      />
    </div>
  );
}
