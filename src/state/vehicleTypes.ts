export interface Vehicle {
  id: string;
  name: string;
  model: string;
  plate: string;
  status: 'disponivel' | 'emprestado' | 'manutencao';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleLoan {
  id: string;
  vehicle_id: string;
  user_id: string;
  loaned_by: string | null;
  returned_by: string | null;
  km_inicial: number;
  km_final: number | null;
  loaned_at: string;
  returned_at: string | null;
  notes: string | null;
  created_at: string;
  
  // Populated relations
  vehicle?: Vehicle;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  loaned_by_user?: {
    id: string;
    full_name: string;
  };
  returned_by_user?: {
    id: string;
    full_name: string;
  };
}

export interface VehicleWithActiveLoan extends Vehicle {
  active_loan?: VehicleLoan;
}

export type CreateVehicleInput = Pick<Vehicle, 'name' | 'model' | 'plate'>;
export type UpdateVehicleInput = Partial<CreateVehicleInput> & { id: string };

export interface CreateVehicleLoanInput {
  vehicle_id: string;
  user_id: string;
  km_inicial: number;
  notes?: string;
}

export interface ReturnVehicleInput {
  km_final: number;
  notes?: string;
}
