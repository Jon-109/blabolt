"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <fieldset className={cn('rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5', className)}>
      <legend className="px-2 text-base font-semibold text-slate-900">{title}</legend>
      {description ? (
        <p className="mt-1 px-2 text-sm text-slate-600">{description}</p>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default FormSection;
