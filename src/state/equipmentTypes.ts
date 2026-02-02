// Tipos para o sistema de gerenciamento de equipamentos

export type EquipmentStatus = 'disponivel' | 'emprestado' | 'manutencao';

export interface Equipment {
  id: string;
  name: string;
  model: string;
  serial_number: string;
  status: EquipmentStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentLoan {
  id: string;
  equipment_id: string;
  user_id: string;
  loaned_at: string;
  returned_at?: string | null;
  loaned_by?: string | null;
  notes?: string | null;
  created_at: string;
}

// Tipo para criar novo equipamento
export type CreateEquipmentInput = Pick<Equipment, 'name' | 'model' | 'serial_number'>;

// Tipo para atualizar equipamento
export type UpdateEquipmentInput = Partial<Pick<Equipment, 'name' | 'model' | 'serial_number' | 'status'>>;

// Tipo para criar empréstimo
export interface CreateLoanInput {
  equipment_id: string;
  user_id: string;
  notes?: string;
}

// Tipo extendido com join de usuário
export interface EquipmentLoanWithUser extends EquipmentLoan {
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  loaned_by_user?: {
    id: string;
    full_name: string;
  };
}

// Tipo extendido de equipamento com empréstimo ativo
export interface EquipmentWithActiveLoan extends Equipment {
  active_loan?: EquipmentLoanWithUser;
}
