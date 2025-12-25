"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "CONTRACT";
  salary: string | null;
  deadline: string | null;
  createdAt: string;
  hasApplied: boolean;
  company: {
    id: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
  };
  _count: {
    applications: number;
  };
}

const jobTypeLabels = {
  INTERNSHIP: "Internship",
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJob();
  }, [id]);

  async function fetchJob() {
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setJob(data);
    }
    setLoading(false);
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setApplying(true);
    setError("");

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: id, coverNote }),
    });

    if (res.ok) {
      setJob((prev) => prev ? { ...prev, hasApplied: true } : null);
      setShowApplyForm(false);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to apply");
    }

    setApplying(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Button onClick={() => router.push("/jobs")} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  const isStudent = session?.user?.role === "STUDENT";

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-600 hover:text-gray-900 mb-6 flex items-center gap-1"
      >
        &larr; Back
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {job.company.logo ? (
                <img
                  src={job.company.logo}
                  alt={job.company.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-2xl text-gray-500 font-medium">
                  {job.company.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-gray-600">{job.company.name}</p>
              </div>
            </div>
            <Badge variant="info">{jobTypeLabels[job.type]}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Job Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Location:</span> {job.location}
            </div>
            {job.salary && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Salary:</span> {job.salary}
              </div>
            )}
            {job.deadline && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Deadline:</span>{" "}
                {new Date(job.deadline).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">About this role</h2>
            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Company Info */}
          {job.company.description && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">About {job.company.name}</h2>
              <p className="text-gray-600">{job.company.description}</p>
              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                >
                  Visit website &rarr;
                </a>
              )}
            </div>
          )}

          {/* Apply Section */}
          {isStudent && (
            <div className="pt-4 border-t">
              {job.hasApplied ? (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                  You have already applied to this position.
                </div>
              ) : showApplyForm ? (
                <form onSubmit={handleApply} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Note (optional)
                    </label>
                    <textarea
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tell the employer why you're a great fit..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={applying}>
                      {applying ? "Submitting..." : "Submit Application"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApplyForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button onClick={() => setShowApplyForm(true)} size="lg">
                  Apply Now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
