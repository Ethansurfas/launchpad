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
  responsibilities: string | null;
  requirements: string | null;
  location: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "CONTRACT";
  salary: string | null;
  deadline: string | null;
  createdAt: string;
  hasApplied: boolean;
  requireResume: boolean;
  requireCoverLetter: boolean;
  requireTranscript: boolean;
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

  // File states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

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

  async function uploadFile(file: File, type: string): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", `application-${type}`);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!job) return;

    // Validate required documents
    if (job.requireResume && !resumeFile) {
      setError("Resume is required for this application");
      return;
    }
    if (job.requireCoverLetter && !coverLetterFile) {
      setError("Cover letter is required for this application");
      return;
    }
    if (job.requireTranscript && !transcriptFile) {
      setError("Transcript is required for this application");
      return;
    }

    setApplying(true);
    setError("");

    try {
      // Upload files
      let resumeUrl = null;
      let coverLetterUrl = null;
      let transcriptUrl = null;

      if (resumeFile) {
        setUploadingFile("resume");
        resumeUrl = await uploadFile(resumeFile, "resume");
        if (!resumeUrl) {
          setError("Failed to upload resume");
          setApplying(false);
          setUploadingFile(null);
          return;
        }
      }

      if (coverLetterFile) {
        setUploadingFile("cover letter");
        coverLetterUrl = await uploadFile(coverLetterFile, "cover-letter");
        if (!coverLetterUrl) {
          setError("Failed to upload cover letter");
          setApplying(false);
          setUploadingFile(null);
          return;
        }
      }

      if (transcriptFile) {
        setUploadingFile("transcript");
        transcriptUrl = await uploadFile(transcriptFile, "transcript");
        if (!transcriptUrl) {
          setError("Failed to upload transcript");
          setApplying(false);
          setUploadingFile(null);
          return;
        }
      }

      setUploadingFile(null);

      // Submit application
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: id,
          coverNote,
          resumeUrl,
          coverLetterUrl,
          transcriptUrl,
        }),
      });

      if (res.ok) {
        setJob((prev) => prev ? { ...prev, hasApplied: true } : null);
        setShowApplyForm(false);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to apply");
      }
    } catch {
      setError("Something went wrong");
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
  const hasDocumentRequirements = job.requireResume || job.requireCoverLetter || job.requireTranscript;

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

          {/* Required Documents Info */}
          {hasDocumentRequirements && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-sm font-medium text-blue-800 mb-1">Required Documents:</p>
              <ul className="text-sm text-blue-700 list-disc list-inside">
                {job.requireResume && <li>Resume</li>}
                {job.requireCoverLetter && <li>Cover Letter</li>}
                {job.requireTranscript && <li>Transcript</li>}
              </ul>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">About this role</h2>
            <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Responsibilities</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                {job.responsibilities}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-2">Requirements</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                {job.requirements}
              </div>
            </div>
          )}

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

                  {/* Document Uploads */}
                  {(job.requireResume || job.requireCoverLetter || job.requireTranscript) && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Upload Documents</h3>

                      {job.requireResume && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resume *
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {resumeFile && (
                            <p className="text-xs text-green-600 mt-1">Selected: {resumeFile.name}</p>
                          )}
                        </div>
                      )}

                      {job.requireCoverLetter && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cover Letter *
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {coverLetterFile && (
                            <p className="text-xs text-green-600 mt-1">Selected: {coverLetterFile.name}</p>
                          )}
                        </div>
                      )}

                      {job.requireTranscript && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Transcript *
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {transcriptFile && (
                            <p className="text-xs text-green-600 mt-1">Selected: {transcriptFile.name}</p>
                          )}
                        </div>
                      )}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Tell the employer why you're a great fit..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={applying}>
                      {applying
                        ? uploadingFile
                          ? `Uploading ${uploadingFile}...`
                          : "Submitting..."
                        : "Submit Application"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApplyForm(false)}
                      disabled={applying}
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
