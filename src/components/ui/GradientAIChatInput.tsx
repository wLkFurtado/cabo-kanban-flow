import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientAIChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  className?: string;
  disabled?: boolean;
}

export function GradientAIChatInput({
  placeholder = "Digite sua mensagem...",
  onSend,
  className,
  disabled = false,
}: GradientAIChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
    >
      <div className="relative">
        {/* Outer thin border */}
        <div
          className="absolute inset-0 rounded-[20px] p-[0.5px]"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%,
              #E5D99D 0deg,
              #E6A49D 90deg,
              #E59B90 180deg,
              #E5CCBA 270deg,
              #E5D99D 360deg
            )`,
          }}
        >
          {/* Main thick border */}
          <div
            className="h-full w-full rounded-[19.5px] p-[2px]"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%,
                #F5E9AD 0deg,
                #F6B4AD 90deg,
                #F5ABA0 180deg,
                #F5DCBA 270deg,
                #F5E9AD 360deg
              )`,
            }}
          >
            <div className="h-full w-full rounded-[17.5px] bg-background relative">
              <div
                className="absolute inset-0 rounded-[17.5px] p-[0.5px]"
                style={{
                  background: `conic-gradient(from 0deg at 50% 50%,
                    rgba(229, 217, 157, 0.1) 0deg,
                    rgba(230, 164, 157, 0.1) 90deg,
                    rgba(229, 155, 144, 0.1) 180deg,
                    rgba(229, 204, 186, 0.1) 270deg,
                    rgba(229, 217, 157, 0.1) 360deg
                  )`,
                }}
              >
                <div className="h-full w-full rounded-[17px] bg-background"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content container */}
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={cn(
                  "w-full resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground text-base leading-6 py-2 px-0 focus:outline-none focus:ring-0 outline-none overflow-hidden transition-colors duration-200",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{ minHeight: "40px", maxHeight: "120px", height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 120) + "px";
                }}
              />
            </div>

            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={disabled || !message.trim()}
              className={cn(
                "flex items-center justify-center w-8 h-8 mt-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
                (disabled || !message.trim()) && "opacity-50 cursor-not-allowed"
              )}
              whileHover={message.trim() ? { scale: 1.1 } : {}}
              whileTap={message.trim() ? { scale: 0.9 } : {}}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Shadow */}
        <div
          className="absolute inset-0 rounded-[20px] shadow-lg pointer-events-none"
          style={{
            opacity: 1,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
          }}
        />
      </div>
    </motion.div>
  );
}
