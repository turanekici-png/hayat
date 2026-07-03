"use client";

export function PolicyAcceptButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (window.opener) {
          window.close();
          return;
        }
        window.history.back();
      }}
      className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-hayat-green px-6 text-sm font-black text-white shadow-green transition hover:-translate-y-0.5 hover:bg-hayat-blue"
    >
      Okudum, kabul ediyorum
    </button>
  );
}
