"use client";
import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { cn } from "../../lib/utils";

export const AnimatedTooltip = ({
  items,
  className,
  imageClassName,
  overlap = true,
  overlapLevel = 4,
}: {
  items: {
    id: number | string;
    name: string;
    designation?: string;
    image: string;
  }[];
  className?: string;
  imageClassName?: string;
  overlap?: boolean;
  overlapLevel?: 1 | 2 | 3 | 4;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | string | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );
  const handleMouseMove = (
    event: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    const target = event.currentTarget;
    const halfWidth = target.offsetWidth / 2;
    const offsetX = event.nativeEvent.offsetX; 
    x.set(offsetX - halfWidth);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map((item) => (
        <div
          className={cn(
            overlap
              ? overlapLevel === 1
                ? "-mr-1"
                : overlapLevel === 2
                ? "-mr-2"
                : overlapLevel === 3
                ? "-mr-3"
                : "-mr-4"
              : "mr-0",
            "relative group"
          )}
          key={String(item.id)}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-16 -left-1/2 translate-x-1/2 flex text-xs flex-col items-center justify-center rounded-md bg-foreground z-50 shadow-xl px-4 py-2"
              >
                <div className="absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent h-px" />
                <div className="absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px" />
                <div className="font-bold text-background relative z-30 text-base">
                  {item.name}
                </div>
                {item.designation && (
                  <div className="text-muted-foreground text-xs">
                    {item.designation}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <img
            onMouseMove={handleMouseMove}
            src={item.image}
            alt={item.name}
            className={cn(
              "object-cover !m-0 !p-0 object-top rounded-full border-2 group-hover:scale-105 group-hover:z-30 border-background relative transition duration-500",
              imageClassName ?? "h-7 w-7"
            )}
          />
        </div>
      ))}
    </div>
  );
};