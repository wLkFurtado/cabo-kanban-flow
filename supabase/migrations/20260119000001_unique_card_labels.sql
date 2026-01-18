-- Step 1: Remove duplicate labels from cards
-- Keep only the oldest occurrence of each board label per card
DELETE FROM public.card_labels
WHERE id IN (
  SELECT cl.id
  FROM public.card_labels cl
  INNER JOIN (
    -- Find duplicates: same card_id and board_label_id
    SELECT card_id, board_label_id, MIN(created_at) as first_created
    FROM public.card_labels
    WHERE board_label_id IS NOT NULL  -- Only check board labels
    GROUP BY card_id, board_label_id
    HAVING COUNT(*) > 1  -- Only where duplicates exist
  ) dupes ON cl.card_id = dupes.card_id 
         AND cl.board_label_id = dupes.board_label_id
  WHERE cl.created_at > dupes.first_created  -- Delete newer duplicates
);

-- Step 2: Add unique constraint to prevent future duplicates
-- This ensures each board label can only be applied once per card
ALTER TABLE public.card_labels 
ADD CONSTRAINT card_labels_card_board_label_unique 
UNIQUE (card_id, board_label_id);

-- Note: This constraint only applies to labels linked to board_labels (board_label_id IS NOT NULL)
-- Legacy manual labels (without board_label_id) can still exist multiple times
-- but that's intentional for backward compatibility
