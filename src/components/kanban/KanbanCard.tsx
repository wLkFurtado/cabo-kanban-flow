import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, LabelColor } from '../../state/kanbanTypes';
import { CardModal } from './CardModal';
import { Calendar, MessageSquare, Tag } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { ImageViewerDialog } from './ImageViewerDialog';
import LazyImage from '../ui/lazy-image';


const coverColorClass: Record<LabelColor, string> = {
  green: 'bg-[hsl(var(--label-green))]',
  yellow: 'bg-[hsl(var(--label-yellow))]',
  orange: 'bg-[hsl(var(--label-orange))]',
  red: 'bg-[hsl(var(--label-red))]',
  purple: 'bg-[hsl(var(--label-purple))]',
  blue: 'bg-[hsl(var(--label-blue))]',
};

interface KanbanCardProps {
  card: Card;
  index: number;
  boardId: string;
  onDeleteCard: (cardId: string) => void;
  onAdvanceCard: (card: Card) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  index,
  boardId,
  onDeleteCard,
  onAdvanceCard,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  

  const formatDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const isOverdue = date < now;
    const isToday = date.toDateString() === now.toDateString();
    
    return {
      text: date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'short' 
      }),
      isOverdue,
      isToday
    };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const dueDateInfo = formatDueDate(card.dueDate ?? null);
  const hasLabels = card.labels && card.labels.length > 0;
  const hasMembers = card.members && card.members.length > 0;
  const hasComments = card.comments && card.comments.length > 0;
  const hasDescription = card.description && card.description.trim() !== '';
  const labelsCount = card.labels ? card.labels.length : 0;
  const commentsCount = card.comments ? card.comments.length : 0;

  return (
    <>
      <Draggable draggableId={card.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          className={`
              bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-pointer relative
              hover:shadow-md transition-shadow duration-200
              ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}
            `}
            onClick={() => setIsModalOpen(true)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdvanceCard(card);
              }
            }}
          >
            

            {/* Cover Color */}
            {card.coverColor && (
              <div 
                className={`h-8 -m-3 mb-2 rounded-t-lg ${coverColorClass[card.coverColor] || 'bg-gray-200'}`}
              />
            )}

            {/* Cover Image */}
            {card.coverImages && card.coverImages.length > 0 && (
              <div className="h-32 mb-2 rounded-md overflow-hidden bg-muted">
                <LazyImage
                src={card.coverImages[0]}
                alt="Card cover"
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  // Abre viewer com imagem original (full quality)
                  const firstCover = card.coverImages && card.coverImages.length > 0 
                    ? (card.coverImages[0] ?? null)
                    : null;
                  setViewerSrc(firstCover);
                  setViewerOpen(true);
                }}
              />
              </div>
            )}

            {/* Labels */}
            {hasLabels && (
              <div className="flex flex-wrap gap-1 mb-2">
                {card.labels.map((label, index) => (
                  <div
                    key={index}
                    className="h-2 w-10 rounded-full"
                    style={{ backgroundColor: label.color }}
                    title={label.name}
                  />
                ))}
              </div>
            )}

            {/* Card Title */}
            <h3 className="text-sm font-normal text-gray-800 leading-5 mb-1">
              {card.title}
            </h3>

            {/* Card Metadata */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                {/* Labels (Tags) Count - always visible */}
              <div className="flex items-center gap-1 text-gray-500">
                <Tag size={12} />
                {/* Mostrar até 3 pontos coloridos das labels */}
                <div className="flex items-center gap-0.5">
                  {card.labels.slice(0, 3).map((label, i) => (
                    <span
                      key={i}
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                  ))}
                </div>
                <span className="text-xs">{labelsCount}</span>
              </div>

                {/* Comments Count - always visible */}
                <div className="flex items-center gap-1 text-gray-500">
                  <MessageSquare size={12} />
                  <span className="text-xs">{commentsCount}</span>
                </div>

                {/* Due Date - show date when available, otherwise muted icon */}
                {dueDateInfo ? (
                  <div className={`
                    flex items-center gap-1 px-1.5 py-0.5 rounded text-xs
                    ${dueDateInfo.isOverdue 
                      ? 'bg-red-100 text-red-700' 
                      : dueDateInfo.isToday 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <Calendar size={10} />
                    <span>{dueDateInfo.text}</span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Calendar size={12} />
                  </div>
                )}
              </div>

              {/* Member Avatars */}
              {hasMembers && (
                <div className="flex -space-x-1">
                  {card.members.slice(0, 3).map((member, index) => (
                    <Avatar key={index} className="w-6 h-6 border-2 border-white" title={member.name}>
                      {member.avatar ? (
                        <AvatarImage src={member.avatar} alt={member.name} />
                      ) : (
                        <AvatarFallback className="bg-blue-500 text-white text-[10px]">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  {card.members.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center border-2 border-white">
                      +{card.members.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {/* Image Viewer for cover image */}
      <ImageViewerDialog
        open={viewerOpen}
        src={viewerSrc}
        onOpenChange={(open) => {
          setViewerOpen(open);
          if (!open) setViewerSrc(null);
        }}
      />

      {isModalOpen && (
        <CardModal
          card={card}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          boardId={boardId}
        />
      )}
    </>
  );
};
