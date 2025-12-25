import { Suspense } from "react";
import ApplicantsContent from "./applicants-content";

export default function ApplicantsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading...</div>}>
      <ApplicantsContent />
    </Suspense>
  );
}
