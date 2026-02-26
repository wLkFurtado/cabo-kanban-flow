-- Tabela para armazenar relatórios de matérias importados de planilhas
CREATE TABLE IF NOT EXISTS public.news_reports (
  id BIGSERIAL PRIMARY KEY,
  external_id INTEGER,
  titulo TEXT NOT NULL,
  data DATE NOT NULL,
  link TEXT,
  categorias TEXT,
  autor TEXT,
  mes_referencia TEXT NOT NULL, -- formato "2026-01", "2026-02", etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para filtros rápidos
CREATE INDEX idx_news_reports_mes ON public.news_reports(mes_referencia);
CREATE INDEX idx_news_reports_autor ON public.news_reports(autor);

-- RLS
ALTER TABLE public.news_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view news_reports"
  ON public.news_reports FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert news_reports"
  ON public.news_reports FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete news_reports"
  ON public.news_reports FOR DELETE
  TO authenticated USING (true);
