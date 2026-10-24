import { clsx, type ClassValue } from "clsx";
import * as React from "react";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * RN falla con "Text strings must be rendered within a <Text> component"
 * cuando un View/Pressable recibe espacios/saltos de línea entre hijos JSX.
 */
export const withoutTextNodes = (children: React.ReactNode) =>
  React.Children.toArray(children).filter(
    (child) => typeof child !== "string" && typeof child !== "number",
  );
