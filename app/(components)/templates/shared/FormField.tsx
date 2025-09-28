"use client";

import * as React from "react";
import { Label } from "@/app/(components)/ui/label";
import { cn } from "@/lib/utils";

export type FormFieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
  labelHint?: string; // short subheader under the label
  children: React.ReactElement | React.ReactElement[];
};

export function FormField({
  label,
  htmlFor,
  required,
  help,
  error,
  className,
  labelHint,
  children,
}: FormFieldProps) {
  const generatedId = React.useId();
  const controlId = htmlFor ?? generatedId;
  const helpId = help ? `${controlId}-help` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const enhancedChild = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        id: controlId,
        "aria-invalid": !!error || undefined,
        "aria-describedby": cn(helpId, errorId) || undefined,
        className: cn(
          (children as any).props?.className,
          error && "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500"
        ),
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={controlId} className="text-sm font-semibold text-gray-800">
          {label}
          {required ? <span className="text-red-600 ml-1">*</span> : null}
        </Label>
        {labelHint ? (
          <span className="text-xs text-gray-500 leading-tight">{labelHint}</span>
        ) : null}
      </div>

      {enhancedChild}

      {help ? (
        <p id={helpId} className="text-xs text-gray-500 mt-1">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-red-600 mt-1">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;
