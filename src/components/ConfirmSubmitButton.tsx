"use client";

import { Trash2 } from "lucide-react";

type ConfirmSubmitButtonProps = {
  message: string;
  label?: string;
  title?: string;
};

export function ConfirmSubmitButton({ message, label = "Eliminar", title = "Eliminar" }: ConfirmSubmitButtonProps) {
  return (
    <button
      className="button-secondary border-red-700 text-red-800 hover:bg-red-50"
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
