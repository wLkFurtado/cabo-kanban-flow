import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNewsReports, type ImportReportInput } from '@/hooks/useNewsReports';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Upload, Search, FileSpreadsheet, ExternalLink, Trash2, X, Users, Newspaper, Tag, BarChart3, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 25;

const MONTH_NAMES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

function formatMonthLabel(mesRef: string) {
  const [year, month] = mesRef.split('-');
  return `${MONTH_NAMES[month] || month}/${year}`;
}

function extractMonthFromDate(raw: unknown): string {
  if (!raw && raw !== 0) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  // Handle JS Date objects (XLSX can return these)
  if (raw instanceof Date) {
    return `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`;
  }
  const str = String(raw).trim();
  // Handle Excel serial dates (any number > 0)
  if (/^\d+$/.test(str) && Number(str) > 0) {
    const d = XLSX.SSF.parse_date_code(Number(str));
    if (d && d.y > 1970) return `${d.y}-${String(d.m).padStart(2, '0')}`;
  }
  // DD-MM-YYYY or DD/MM/YYYY
  const match = str.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (match) return `${match[3]}-${match[2]}`;
  // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const match2 = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match2) return `${match2[1]}-${match2[2]}`;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseDate(raw: unknown): string {
  if (!raw && raw !== 0) return '';
  // Handle JS Date objects
  if (raw instanceof Date) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(raw).trim();
  // Excel serial (any positive integer)
  if (/^\d+$/.test(str) && Number(str) > 0) {
    const d = XLSX.SSF.parse_date_code(Number(str));
    if (d && d.y > 1970) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  // DD-MM-YYYY or DD/MM/YYYY
  const match = str.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  // YYYY-MM-DD
  const match2 = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match2) return str.substring(0, 10);
  return str;
}

export default function Relatorios() {
  const { reports, loading, importReports, isImporting, deleteByMonth, isDeleting } = useNewsReports();
  const { isAdmin } = useAdminRole();

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ImportReportInput[]>([]);
  const [detectedMonths, setDetectedMonths] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteMonth, setDeleteMonth] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAuthor, setFilterAuthor] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Derive filter options from data
  const months = useMemo(() => {
    const set = new Set(reports.map((r) => r.mes_referencia));
    return Array.from(set).sort();
  }, [reports]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.categorias) {
        r.categorias.split('|').forEach((c) => set.add(c.trim()));
      }
    });
    return Array.from(set).sort();
  }, [reports]);

  const authors = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.autor) set.add(r.autor.trim());
    });
    return Array.from(set).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch =
        !searchTerm ||
        r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.autor && r.autor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.categorias && r.categorias.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMonth = filterMonth === 'all' || r.mes_referencia === filterMonth;
      const matchesCategory = filterCategory === 'all' || (r.categorias && r.categorias.includes(filterCategory));
      const matchesAuthor = filterAuthor === 'all' || r.autor === filterAuthor;
      return matchesSearch && matchesMonth && matchesCategory && matchesAuthor;
    });
  }, [reports, searchTerm, filterMonth, filterCategory, filterAuthor]);

  // Paginated reports
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  // Reset to page 1 when filters change
  const filterKey = `${searchTerm}|${filterMonth}|${filterCategory}|${filterAuthor}`;
  const prevFilterKeyRef = useRef(filterKey);
  if (prevFilterKeyRef.current !== filterKey) {
    prevFilterKeyRef.current = filterKey;
    if (currentPage !== 1) setCurrentPage(1);
  }

  // KPI data
  const totalMatches = filteredReports.length;
  const uniqueAuthors = useMemo(() => {
    const set = new Set(filteredReports.map((r) => r.autor).filter(Boolean));
    return set.size;
  }, [filteredReports]);
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    filteredReports.forEach((r) => {
      if (r.categorias) r.categorias.split('|').forEach((c) => set.add(c.trim()));
    });
    return set.size;
  }, [filteredReports]);

  // File handling
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      if (rows.length === 0) return;

      setFileName(file.name);

      const parsed: ImportReportInput[] = rows.map((row) => {
        const rawDate = row['Data'] ?? row['data'];
        return {
          external_id: row['Id'] != null ? Number(row['Id']) : (row['id'] != null ? Number(row['id']) : null),
          titulo: String(row['Titulo'] ?? row['Título'] ?? row['titulo'] ?? row['título'] ?? ''),
          data: parseDate(rawDate),
          link: row['Link'] != null ? String(row['Link']) : (row['link'] != null ? String(row['link']) : null),
          categorias: row['Categorias'] != null ? String(row['Categorias']) : (row['categorias'] != null ? String(row['categorias']) : null),
          autor: row['Autor'] != null ? String(row['Autor']) : (row['autor'] != null ? String(row['autor']) : null),
          mes_referencia: extractMonthFromDate(rawDate),
        };
      }).filter((r) => r.titulo.length > 0);

      const uniqueMonths = Array.from(new Set(parsed.map((r) => r.mes_referencia))).sort();
      setDetectedMonths(uniqueMonths);
      setParsedRows(parsed);
      setUploadOpen(true);
    } catch {
      // Error will be shown by toast
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    await importReports(parsedRows);
    setUploadOpen(false);
    setParsedRows([]);
    setFileName('');
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return dateStr;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMonth('all');
    setFilterCategory('all');
    setFilterAuthor('all');
  };

  const hasActiveFilters = searchTerm || filterMonth !== 'all' || filterCategory !== 'all' || filterAuthor !== 'all';

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Relatórios
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Relatórios de matérias publicadas no site de notícias
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Planilha
            </Button>
          )}
          {isAdmin && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = '';
              }}
            />
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-800 rounded-lg p-2">
              <Newspaper className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">Matérias</p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{totalMatches}</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-800 rounded-lg p-2">
              <Users className="w-5 h-5 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-xs text-green-600 dark:text-green-300 font-medium">Autores</p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">{uniqueAuthors}</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-800 rounded-lg p-2">
              <Tag className="w-5 h-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-300 font-medium">Categorias</p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{uniqueCategories}</p>
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-800 rounded-lg p-2">
              <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-300" />
            </div>
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-300 font-medium">Meses</p>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-100">{months.length}</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por título, autor ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="all">Todos os meses</option>
            {months.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm max-w-[200px]"
          >
            <option value="all">Todas categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm max-w-[200px]"
          >
            <option value="all">Todos autores</option>
            {authors.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4 mr-1" /> Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando relatórios...</div>
        ) : reports.length === 0 ? (
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nenhum relatório importado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Arraste uma planilha <strong>.xlsx</strong> aqui ou clique para selecionar
            </p>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Selecionar arquivo
            </Button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma matéria encontrada com os filtros aplicados.
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 w-12">ID</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Título</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 w-28">Data</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 w-16">Link</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Categorias</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 w-40">Autor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReports.map((report) => (
                      <tr
                        key={report.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                          {report.external_id || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium max-w-md">
                          <span className="line-clamp-2">{report.titulo}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatDisplayDate(report.data)}
                        </td>
                        <td className="px-4 py-3">
                          {report.link ? (
                            <a
                              href={report.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center"
                              title="Abrir matéria"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {report.categorias?.split('|').map((cat, i) => (
                              <span
                                key={i}
                                className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full"
                              >
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {report.autor || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination + Delete Month */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
              {isAdmin && months.map((m) => (
                  <Button
                    key={m}
                    variant="outline"
                    size="sm"
                    className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => setDeleteMonth(m)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {formatMonthLabel(m)}
                  </Button>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Preview Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Planilha</DialogTitle>
            <DialogDescription>
              Confira os dados antes de importar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{fileName}</p>
                <p className="text-sm text-gray-500">
                  {parsedRows.length} matérias encontradas • {detectedMonths.length === 1 ? 'Mês' : 'Meses'}: <strong>{detectedMonths.map(formatMonthLabel).join(', ')}</strong>
                </p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0">
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Título</th>
                      <th className="text-left px-3 py-2">Data</th>
                      <th className="text-left px-3 py-2">Autor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-3 py-1.5 text-gray-500">{row.external_id || '—'}</td>
                        <td className="px-3 py-1.5 max-w-xs truncate">{row.titulo}</td>
                        <td className="px-3 py-1.5 whitespace-nowrap">{formatDisplayDate(row.data)}</td>
                        <td className="px-3 py-1.5">{row.autor || '—'}</td>
                      </tr>
                    ))}
                    {parsedRows.length > 20 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-center text-gray-400 text-xs">
                          ... e mais {parsedRows.length - 20} matérias
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? 'Importando...' : `Importar ${parsedRows.length} matérias`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMonth} onOpenChange={() => setDeleteMonth(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover dados do mês</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover todos os dados de <strong>{deleteMonth ? formatMonthLabel(deleteMonth) : ''}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteMonth) {
                  deleteByMonth(deleteMonth);
                  setDeleteMonth(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
