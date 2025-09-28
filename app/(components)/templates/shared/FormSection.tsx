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
    <fieldset className={cn("border border-gray-200 rounded-xl p-6 bg-white/50", className)}>
      <legend className="text-lg font-semibold px-2">{title}</legend>
      {description ? (
        <p className="text-sm text-gray-600 mt-1 px-2">{description}</p>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default FormSection;
