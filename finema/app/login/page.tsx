import { Suspense } from "react";
import { LoginPageContent } from "./LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-finema-bg flex items-center justify-center">
          <div className="text-finema-muted">Loading...</div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
