-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'guest');

-- Create board and event related enums
CREATE TYPE public.board_visibility AS ENUM ('private', 'team', 'public');
CREATE TYPE public.card_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.event_type AS ENUM ('reuniao', 'tarefa', 'escala', 'evento');
CREATE TYPE public.event_priority AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.event_status AS ENUM ('pendente', 'em_andamento', 'concluido', 'cancelado');
CREATE TYPE public.event_recurrence AS ENUM ('nenhuma', 'diaria', 'semanal', 'mensal');

-- Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Create boards table
CREATE TABLE public.boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    visibility board_visibility DEFAULT 'private',
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create board_members table
CREATE TABLE public.board_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (board_id, user_id)
);

-- Create board_lists table
CREATE TABLE public.board_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cards table
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES public.board_lists(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    priority card_priority DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_members table
CREATE TABLE public.card_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (card_id, user_id)
);

-- Create card_labels table
CREATE TABLE public.card_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_comments table
CREATE TABLE public.card_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_fields table
CREATE TABLE public.custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL, -- text, number, date, select, checkbox
    options JSONB, -- for select fields
    required BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_custom_values table
CREATE TABLE public.card_custom_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    custom_field_id UUID REFERENCES public.custom_fields(id) ON DELETE CASCADE NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (card_id, custom_field_id)
);

-- Create events table (for agenda)
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_participants table
CREATE TABLE public.event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    response TEXT DEFAULT 'pending', -- pending, accepted, declined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

-- Create pautas_events table
CREATE TABLE public.pautas_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo event_type NOT NULL,
    prioridade event_priority DEFAULT 'media',
    status event_status DEFAULT 'pendente',
    recorrencia event_recurrence DEFAULT 'nenhuma',
    cor TEXT DEFAULT '#6366f1',
    local TEXT,
    responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    criado_por UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pautas_participants table
CREATE TABLE public.pautas_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.pautas_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pautas_participants ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'user'::app_role
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- Create RLS policies for boards
CREATE POLICY "Users can view boards they own or are members of" ON public.boards
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.board_members 
            WHERE board_id = boards.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own boards" ON public.boards
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Board owners can update their boards" ON public.boards
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Board owners can delete their boards" ON public.boards
    FOR DELETE USING (owner_id = auth.uid());

-- Create RLS policies for board_members
CREATE POLICY "Users can view members of boards they access" ON public.board_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members bm WHERE bm.board_id = boards.id AND bm.user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board owners can manage members" ON public.board_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND owner_id = auth.uid()
        )
    );

-- Create RLS policies for board_lists
CREATE POLICY "Users can view lists of accessible boards" ON public.board_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage lists" ON public.board_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.boards 
            WHERE id = board_id AND (
                owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = boards.id AND user_id = auth.uid())
            )
        )
    );

-- Create RLS policies for cards
CREATE POLICY "Users can view cards in accessible boards" ON public.cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.board_lists bl
            JOIN public.boards b ON bl.board_id = b.id
            WHERE bl.id = list_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Board members can manage cards" ON public.cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.board_lists bl
            JOIN public.boards b ON bl.board_id = b.id
            WHERE bl.id = list_id AND (
                b.owner_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.board_members WHERE board_id = b.id AND user_id = auth.uid())
            )
        )
    );

-- Create RLS policies for events
CREATE POLICY "Users can view events they created or are invited to" ON public.events
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.event_participants 
            WHERE event_id = events.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create events" ON public.events
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Event creators can update their events" ON public.events
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Event creators can delete their events" ON public.events
    FOR DELETE USING (created_by = auth.uid());

-- Create RLS policies for pautas_events
CREATE POLICY "Users can view pautas events they created or participate in" ON public.pautas_events
    FOR SELECT USING (
        criado_por = auth.uid() OR
        responsavel_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.pautas_participants 
            WHERE event_id = pautas_events.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create pautas events" ON public.pautas_events
    FOR INSERT WITH CHECK (criado_por = auth.uid());

CREATE POLICY "Event creators can update their pautas events" ON public.pautas_events
    FOR UPDATE USING (criado_por = auth.uid());

CREATE POLICY "Event creators can delete their pautas events" ON public.pautas_events
    FOR DELETE USING (criado_por = auth.uid());

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_boards_updated_at BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_board_lists_updated_at BEFORE UPDATE ON public.board_lists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_pautas_events_updated_at BEFORE UPDATE ON public.pautas_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();