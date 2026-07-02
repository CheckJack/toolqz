"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type ToastAlertVariant = "success" | "error";

interface ToastAlertAction {
  label: string;
  onClick: () => void;
}

export interface ToastAlert3Props {
  title: string;
  description?: string;
  variant?: ToastAlertVariant;
  onDismiss?: () => void;
  action?: ToastAlertAction;
  className?: string;
}

export function ToastAlert3({
  title,
  description,
  variant = "success",
  onDismiss,
  action,
  className,
}: ToastAlert3Props) {
  const Icon = variant === "error" ? CircleAlert : CircleCheck;
  const alertVariant = variant === "error" ? "destructive" : "success";

  return (
    <Alert
      variant={alertVariant}
      className={cn(
        "pointer-events-auto flex w-full min-w-[min(100vw-2rem,22rem)] items-start gap-3 px-4 py-3 shadow-lg",
        className
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", variant === "error" ? "text-red-400" : "text-neon")}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <AlertTitle>{title}</AlertTitle>
        {description ? <AlertDescription>{description}</AlertDescription> : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 w-fit text-left text-[13px] font-semibold text-neon underline underline-offset-2"
          >
            {action.label}
          </button>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="cursor-pointer self-start rounded-md p-0.5 text-muted transition-colors hover:text-white"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </Alert>
  );
}

export default ToastAlert3;
