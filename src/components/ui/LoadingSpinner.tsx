import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
  );
}
