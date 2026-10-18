import type { ReactNode } from "react";
import { AdminFrame } from "./AdminFrame";

type AdminShellProps = {
  activePath?: string;
  children: ReactNode;
  contentClassName?: string;
};

// Admin alt sayfalarinin ortak cercevesi (ust cubuk + gruplu sol menu). bkz. AdminFrame.
export async function AdminShell({ activePath = "/admin", children, contentClassName = "max-w-7xl" }: AdminShellProps) {
  return (
    <AdminFrame active={activePath} contentClassName={contentClassName}>
      {children}
    </AdminFrame>
  );
}
