import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`glass ${hover ? "glass-hover" : ""} p-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
