"use client";

export function PolicyAcceptButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "policy-accepted", slug: window.location.pathname.replace(/^\/+/, "") }, window.location.origin);
          return;
        }
        if (window.opener) {
          window.opener.postMessage({ type: "policy-accepted", slug: window.location.pathname.replace(/^\/+/, "") }, window.location.origin);
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
