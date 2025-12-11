import { useMemo } from "react";
import { useBoardsStore } from "@/state/boards/store";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/state/kanbanTypes";
import { format, isBefore, isAfter, addDays } from "date-fns";

export interface UserDemandWithBoard {
  card: Card;
  boardId: string;
  boardTitle: string;
}

export function useUserDemands() {
  const { boards } = useBoardsStore();
  const { user } = useAuth();

  const userDemands = useMemo((): UserDemandWithBoard[] => {
    if (!user) return [];

    const demands: UserDemandWithBoard[] = [];
    const userEmail = user.email || '';
    const userName = (user.user_metadata?.full_name as string) || '';

    Object.entries(boards).forEach(([boardId, board]) => {
      if (board.isTemplate) return; // Skip template boards

      Object.values(board.cardsByList).forEach((cards) => {
        cards.forEach((card) => {
          // Check if current user is a member of this card
          const isMember = card.members.some(member => 
            member.id === user.id || member.name === userName || member.email === userEmail
          );

          if (isMember && !card.archived) {
            demands.push({
              card,
              boardId,
              boardTitle: board.title,
            });
          }
        });
      });
    });

    return demands;
  }, [boards, user]);

  const getDemandsByDate = (date: string): UserDemandWithBoard[] => {
    return userDemands.filter(demand => {
      if (!demand.card.dueDate) return false;
      const cardDate = format(new Date(demand.card.dueDate), 'yyyy-MM-dd');
      return cardDate === date;
    });
  };

  const getUpcomingDemands = (limit: number = 10) => {
    const now = new Date();
    return userDemands
      .filter(demand => demand.card.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.card.dueDate!);
        const dateB = new Date(b.card.dueDate!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, limit);
  };

  const getOverdueDemands = () => {
    const now = new Date();
    return userDemands.filter(demand => {
      if (!demand.card.dueDate) return false;
      return isBefore(new Date(demand.card.dueDate), now);
    });
  };

  const getDueSoonDemands = () => {
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);
    return userDemands.filter(demand => {
      if (!demand.card.dueDate) return false;
      const dueDate = new Date(demand.card.dueDate);
      return isAfter(dueDate, now) && isBefore(dueDate, threeDaysFromNow);
    });
  };

  const getDatesWithDemands = () => {
    const dates = new Set<string>();
    userDemands.forEach(demand => {
      if (demand.card.dueDate) {
        const dateStr = format(new Date(demand.card.dueDate), 'yyyy-MM-dd');
        dates.add(dateStr);
      }
    });
    return dates;
  };

  return {
    userDemands,
    getDemandsByDate,
    getUpcomingDemands,
    getOverdueDemands,
    getDueSoonDemands,
    getDatesWithDemands,
  };
}