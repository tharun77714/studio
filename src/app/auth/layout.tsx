import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden relative">
      {children}
    </div>
  );
}
