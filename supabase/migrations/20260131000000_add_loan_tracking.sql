-- Add loan tracking columns to equipment_loans table
-- This allows tracking who loaned the equipment and who returned it

-- Add columns
ALTER TABLE public.equipment_loans
ADD COLUMN loaned_by UUID REFERENCES public.profiles(id),
ADD COLUMN returned_by UUID REFERENCES public.profiles(id);

-- Add comment for documentation
COMMENT ON COLUMN public.equipment_loans.loaned_by IS 'User who loaned the equipment to someone';
COMMENT ON COLUMN public.equipment_loans.returned_by IS 'User who processed the return';
