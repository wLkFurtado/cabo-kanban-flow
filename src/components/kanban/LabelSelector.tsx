import React, { useState } from 'react';
import { BoardLabel } from '@/state/kanbanTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Settings, X, Plus, Pencil } from 'lucide-react';

interface LabelSelectorProps {
  boardLabels: BoardLabel[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onCreateLabel?: (name: string, color: string) => void;
  onManageLabels?: () => void;
}

export function LabelSelector({
  boardLabels,
  selectedLabelIds,
  onToggleLabel,
  onCreateLabel,
  onManageLabels,
}: LabelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');

  const filteredLabels = boardLabels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateLabel = () => {
    if (onCreateLabel && newLabelName.trim()) {
      onCreateLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName('');
      setNewLabelColor('#6366f1');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar etiquetas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Labels List */}
      <div className="max-h-[300px] overflow-y-auto space-y-1 p-1">
        {filteredLabels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {searchQuery
              ? 'Nenhuma etiqueta encontrada'
              : 'Nenhuma etiqueta disponível'}
          </p>
        ) : (
          filteredLabels.map((label) => {
            const isSelected = selectedLabelIds.includes(label.id);
            return (
              <div
                key={label.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors',
                  isSelected && 'bg-muted'
                )}
                onClick={() => onToggleLabel(label.id)}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <Badge
                  className="flex-1"
                  style={{ backgroundColor: label.color, color: '#fff' }}
                >
                  {label.name}
                </Badge>
              </div>
            );
          })
        )}
      </div>

      {/* Create New Label Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Criar nova etiqueta</span>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Input
            placeholder="Nome da etiqueta"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateLabel();
              }
            }}
          />
          <div className="flex gap-2">
            <input
              type="color"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              className="w-12 h-9 rounded border cursor-pointer"
            />
            <Input
              placeholder="#HEX"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
              className="flex-1"
            />
          </div>
          <Button
            onClick={handleCreateLabel}
            disabled={!newLabelName.trim()}
            className="w-full"
            size="sm"
          >
            Criar etiqueta
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        {!showCreateForm && onCreateLabel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar nova etiqueta
          </Button>
        )}
        {onManageLabels && (
          <Button
            variant="outline"
            size="sm"
            onClick={onManageLabels}
            className={cn(showCreateForm || !onCreateLabel ? 'flex-1' : '')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar etiquetas
          </Button>
        )}
      </div>
    </div>
  );
}
