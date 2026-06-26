"use client";

import { FileDown, Printer } from "lucide-react";

export function ReceiptActions() {
  function printReceipt() {
    window.print();
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={printReceipt}
        className="inline-flex items-center gap-2 rounded-full bg-hayat-green px-6 py-3 font-black text-white transition hover:bg-hayat-dark"
      >
        <Printer size={18} /> Yazdır
      </button>
      <button
        type="button"
        onClick={printReceipt}
        className="inline-flex items-center gap-2 rounded-full bg-hayat-blue px-6 py-3 font-black text-white transition hover:bg-hayat-dark"
      >
        <FileDown size={18} /> PDF Kaydet
      </button>
    </div>
  );
}
