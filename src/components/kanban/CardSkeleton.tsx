import React from 'react';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  className?: string;
  showCover?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ 
  className, 
  showCover = true 
}) => {
  return (
    <div className={cn("bg-white rounded-lg border p-3 space-y-3 animate-pulse", className)}>
      {/* Cover skeleton */}
      {showCover && (
        <div className="h-32 bg-gray-200 rounded-md" />
      )}
      
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      
      {/* Labels skeleton */}
      <div className="flex gap-1">
        <div className="w-10 h-2 bg-gray-200 rounded-full" />
        <div className="w-8 h-2 bg-gray-200 rounded-full" />
      </div>
      
      {/* Footer skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="w-4 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex -space-x-1">
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
          <div className="w-6 h-6 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;