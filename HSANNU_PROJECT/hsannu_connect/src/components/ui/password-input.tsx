import * as React from "react";
import { Input } from "./input";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps extends React.ComponentProps<typeof Input> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        ref={ref}
        className={className}
        type={visible ? "text" : "password"}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";


