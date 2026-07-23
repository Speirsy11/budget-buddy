"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export type CardSurface =
  | "sage"
  | "peach"
  | "sky"
  | "lav"
  | "lemon"
  | "linen"
  | "white";

const surfaceClasses: Record<CardSurface, string> = {
  sage: "bg-surface-sage",
  peach: "bg-surface-peach",
  sky: "bg-surface-sky",
  lav: "bg-surface-lav",
  lemon: "bg-surface-lemon",
  linen: "bg-surface-linen",
  white: "bg-card",
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, surface = "white", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-card-foreground rounded-bento shadow-card relative",
        // eslint-disable-next-line security/detect-object-injection -- surface is from CardSurface union
        surfaceClasses[surface],
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-ink-soft text-sm", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
