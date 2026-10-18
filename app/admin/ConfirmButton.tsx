"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";

/**
 * Silme gibi geri alinamaz islemler icin onay soran buton. Kullanici
 * vazgecerse form gonderilmez (yanlislikla tiklamayla veri kaybini onler).
 */
export function ConfirmButton({ confirmMessage, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return <button {...props} onClick={handleClick} />;
}
