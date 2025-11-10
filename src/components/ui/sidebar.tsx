"use client";

import { cn } from "../../lib/utils";
import { NavLink, NavLinkProps } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      {(() => {
        const { children, ...rest } = props;
        return (
          <MobileSidebar {...rest}>
            {children as React.ReactNode}
          </MobileSidebar>
        );
      })()}
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-screen sticky top-0 px-4 py-4 hidden md:flex md:flex-col bg-white dark:bg-neutral-800 w-[300px] flex-shrink-0 border-r border-neutral-200 dark:border-neutral-700 shadow-sm",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "84px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

type MotionDivProps = React.ComponentProps<typeof motion.div>;
type MobileSidebarProps = Omit<MotionDivProps, "children"> & {
  children?: React.ReactNode;
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: MobileSidebarProps) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed inset-0 h-full w-full bg-white dark:bg-neutral-900 px-4 py-4 z-[100] flex flex-col md:hidden overflow-y-auto gap-4 justify-start",
              className
            )}
            {...props}
          >
            <div
              className="absolute right-4 top-4 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <X />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

type SidebarLinkProps = {
  link: Links;
  className?: string;
} & Omit<NavLinkProps, "to" | "className">;

export const SidebarLink = ({
  link,
  className,
  ...props
}: SidebarLinkProps) => {
  const { open, animate } = useSidebar();
  return (
    <NavLink
      to={link.href}
      className={({ isActive }) =>
        cn(
          "flex items-center w-full group/sidebar py-2 rounded-md transition-colors",
          open ? "justify-start gap-2 px-2" : "justify-center gap-0 px-1",
          isActive
            ? (open
                ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-primary/20"
                : "bg-accent text-accent-foreground shadow-sm ring-1 ring-primary/25")
            : (open
                ? "hover:bg-accent hover:text-accent-foreground"
                : "hover:bg-accent/50 hover:text-accent-foreground"),
          className
        )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </NavLink>
  );
};

export const SidebarTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) => {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      className={cn("inline-flex items-center justify-center", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children ?? <Menu className="h-5 w-5" />}
    </button>
  );
};
