-- Grant admins visibility across all boards and related entities
-- Requires: public.get_current_user_role() to return 'admin' for admin users

-- Admins can view all boards
CREATE POLICY "admin_select_boards_all" ON public.boards
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Admins can view all board lists
CREATE POLICY "admin_select_board_lists_all" ON public.board_lists
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Admins can view all board members
CREATE POLICY "admin_select_board_members_all" ON public.board_members
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Admins can view all cards
CREATE POLICY "admin_select_cards_all" ON public.cards
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Admins can view all card members
CREATE POLICY "admin_select_card_members_all" ON public.card_members
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Admins can view all card labels
CREATE POLICY "admin_select_card_labels_all" ON public.card_labels
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Admins can view all custom fields
CREATE POLICY "admin_select_custom_fields_all" ON public.custom_fields
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Admins can view all card custom values
CREATE POLICY "admin_select_card_custom_values_all" ON public.card_custom_values
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Note: If you also want admins to manage (insert/update/delete) these tables globally,
-- create corresponding policies with FOR ALL USING (...) and FOR INSERT WITH CHECK (...).