import { cn } from "@/lib/utils";

export function Label({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
      {required && <span className="text-danger"> *</span>}
    </label>
  );
}

const fieldBase =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-light focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors";

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-24 resize-y", className)} {...rest} />;
}

export function Select({ className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, "cursor-pointer", className)} {...rest} />;
}

export function FieldGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}
