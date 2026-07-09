import { Suspense } from "react";
import { SignupPageContent } from "./SignupPageContent";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-finema-bg flex items-center justify-center">
          <div className="text-finema-muted">Loading...</div>
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
