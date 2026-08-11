"use client";

import { Trash2 } from "lucide-react";
import type { ComponentProps } from "react";

type ConfirmSubmitButtonProps = {
  message: string;
  label?: string;
  title?: string;
  formAction?: ComponentProps<"button">["formAction"];
};

export function ConfirmSubmitButton({ formAction, message, label = "Eliminar", title = "Eliminar" }: ConfirmSubmitButtonProps) {
  return (
    <button
      className="button-secondary border-red-700 text-red-800 hover:bg-red-50"
      formAction={formAction}
      title={title}
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 size={16} /> {label}
    </button>
  );
}
