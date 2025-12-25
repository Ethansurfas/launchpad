"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DRAFT_KEY = "job-draft";

interface JobDraft {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  location: string;
  type: string;
  salary: string;
  deadline: string;
  requireResume: boolean;
  requireCoverLetter: boolean;
  requireTranscript: boolean;
}

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsCompany, setNeedsCompany] = useState(false);
  const [draft, setDraft] = useState<JobDraft | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  function saveDraft(formData: FormData) {
    const data: JobDraft = {
      title: formData.get("title") as string || "",
      description: formData.get("description") as string || "",
      responsibilities: formData.get("responsibilities") as string || "",
      requirements: formData.get("requirements") as string || "",
      location: formData.get("location") as string || "",
      type: formData.get("type") as string || "INTERNSHIP",
      salary: formData.get("salary") as string || "",
      deadline: formData.get("deadline") as string || "",
      requireResume: formData.get("requireResume") === "on",
      requireCoverLetter: formData.get("requireCoverLetter") === "on",
      requireTranscript: formData.get("requireTranscript") === "on",
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsCompany(false);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      responsibilities: formData.get("responsibilities") || null,
      requirements: formData.get("requirements") || null,
      location: formData.get("location"),
      type: formData.get("type"),
      salary: formData.get("salary") || null,
      deadline: formData.get("deadline") || null,
      requireResume: formData.get("requireResume") === "on",
      requireCoverLetter: formData.get("requireCoverLetter") === "on",
      requireTranscript: formData.get("requireTranscript") === "on",
    };

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      clearDraft();
      router.push("/employer/jobs");
    } else {
      const result = await res.json();
      if (result.error === "No company associated") {
        // Save draft and show company setup prompt
        saveDraft(formData);
        setNeedsCompany(true);
        setError("You need to set up your company before posting jobs.");
      } else {
        setError(result.error || "Failed to create job");
      }
    }

    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p className="text-gray-600 mt-1">Create a job listing to find candidates</p>
      </div>

      {draft && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
          <span>Draft restored from your previous session.</span>
          <button
            onClick={clearDraft}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear draft
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Job Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
                {needsCompany && (
                  <div className="mt-3">
                    <Link href="/employer/onboarding">
                      <Button type="button" size="sm">
                        Set Up Company
                      </Button>
                    </Link>
                    <p className="mt-2 text-xs text-red-500">
                      Your job details have been saved and will be restored when you return.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                name="title"
                type="text"
                required
                defaultValue={draft?.title || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="e.g., Software Engineering Intern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                defaultValue={draft?.description || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Brief overview of the role..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsibilities
              </label>
              <textarea
                name="responsibilities"
                rows={5}
                defaultValue={draft?.responsibilities || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="- Swab the deck daily&#10;- Stand watch for rival vessels&#10;- Assist with treasure acquisition..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <textarea
                name="requirements"
                rows={5}
                defaultValue={draft?.requirements || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="- Strong swimming skills&#10;- Comfortable with parrots&#10;- 2+ years of sailing experience..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  name="location"
                  type="text"
                  required
                  defaultValue={draft?.location || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="e.g., San Francisco, CA or Remote"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Type *
                </label>
                <select
                  name="type"
                  required
                  defaultValue={draft?.type || "INTERNSHIP"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Range
                </label>
                <input
                  name="salary"
                  type="text"
                  defaultValue={draft?.salary || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="e.g., $25/hr or $50k-70k"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Deadline
                </label>
                <input
                  name="deadline"
                  type="date"
                  defaultValue={draft?.deadline || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Required Documents
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select which documents applicants must submit
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireResume"
                    defaultChecked={draft?.requireResume ?? true}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Resume</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireCoverLetter"
                    defaultChecked={draft?.requireCoverLetter ?? false}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Cover Letter</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireTranscript"
                    defaultChecked={draft?.requireTranscript ?? false}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Transcript</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Job"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
