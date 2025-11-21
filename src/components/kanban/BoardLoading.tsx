import React from 'react';
import { CardSkeleton } from './CardSkeleton';

interface BoardLoadingProps {
  listCount?: number;
  cardCountPerList?: number;
}

export const BoardLoading: React.FC<BoardLoadingProps> = ({ 
  listCount = 3, 
  cardCountPerList = 3 
}) => {
  return (
    <div className="flex gap-4 h-full pb-4">
      {Array.from({ length: listCount }).map((_, listIndex) => (
        <div key={listIndex} className="flex-shrink-0 w-80">
          {/* List header skeleton */}
          <div className="bg-white rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          
          {/* Cards skeleton */}
          <div className="space-y-2">
            {Array.from({ length: cardCountPerList }).map((_, cardIndex) => (
              <CardSkeleton key={cardIndex} />
            ))}
          </div>
          
          {/* Add card button skeleton */}
          <div className="mt-3 p-3 bg-white rounded-lg border-2 border-dashed border-gray-200">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardLoading;