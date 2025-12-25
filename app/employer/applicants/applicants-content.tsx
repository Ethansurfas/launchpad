"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Applicant {
  id: string;
  status: "PENDING" | "REVIEWING" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";
  coverNote: string | null;
  resumeUrl: string | null;
  coverLetterUrl: string | null;
  transcriptUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    studentProfile: {
      university: string | null;
      major: string | null;
      gradYear: number | null;
      bio: string | null;
      skills: string[];
      resumeUrl: string | null;
      linkedIn: string | null;
      github: string | null;
    } | null;
  };
  job: {
    id: string;
    title: string;
  };
  interviews?: {
    id: string;
    status: string;
    scheduledAt: string | null;
  }[];
}

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFERED", label: "Offered" },
  { value: "REJECTED", label: "Rejected" },
];

const statusConfig = {
  PENDING: { label: "Pending", variant: "default" as const },
  REVIEWING: { label: "Reviewing", variant: "info" as const },
  INTERVIEW: { label: "Interview", variant: "success" as const },
  OFFERED: { label: "Offered", variant: "success" as const },
  REJECTED: { label: "Rejected", variant: "error" as const },
  WITHDRAWN: { label: "Withdrawn", variant: "default" as const },
};

export default function ApplicantsContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Interview scheduling state
  const [schedulingFor, setSchedulingFor] = useState<Applicant | null>(null);
  const [duration, setDuration] = useState(30);
  const [timeSlots, setTimeSlots] = useState<string[]>(["", "", ""]);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  async function fetchApplicants() {
    const params = new URLSearchParams();
    if (jobId) params.set("job", jobId);

    const res = await fetch(`/api/employer/applicants?${params}`);
    if (res.ok) {
      const data = await res.json();
      setApplicants(data);
    }
    setLoading(false);
  }

  async function updateStatus(applicationId: string, status: string) {
    const res = await fetch("/api/employer/applicants", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });

    if (res.ok) {
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: status as Applicant["status"] } : app
        )
      );
    }
  }

  async function scheduleInterview() {
    if (!schedulingFor) return;

    const validSlots = timeSlots.filter((slot) => slot);
    if (validSlots.length < 2) {
      setScheduleError("Please provide at least 2 time slots");
      return;
    }

    setScheduling(true);
    setScheduleError(null);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: schedulingFor.id,
          duration,
          timeSlots: validSlots.map((slot) => ({ startTime: slot })),
        }),
      });

      if (res.ok) {
        setSchedulingFor(null);
        setTimeSlots(["", "", ""]);
        fetchApplicants(); // Refresh to show updated status
      } else {
        const data = await res.json();
        setScheduleError(data.error || "Failed to schedule interview");
      }
    } catch {
      setScheduleError("Failed to schedule interview");
    }

    setScheduling(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Applicants</h1>
        <p className="text-gray-600 mt-1">Review and manage job applications</p>
      </div>

      {applicants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No applications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applicants.map((app) => (
            <Card key={app.id}>
              <CardContent className="py-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{app.user.name}</h3>
                      <Badge variant={statusConfig[app.status].variant}>
                        {statusConfig[app.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{app.user.email}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Applied for <span className="font-medium">{app.job.title}</span>
                      {" · "}
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>

                    {app.user.studentProfile && (
                      <div className="mt-2 text-sm text-gray-600">
                        {app.user.studentProfile.major && app.user.studentProfile.university && (
                          <p>
                            {app.user.studentProfile.major} at {app.user.studentProfile.university}
                            {app.user.studentProfile.gradYear && ` (${app.user.studentProfile.gradYear})`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Expanded details */}
                    {expandedId === app.id && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {app.coverNote && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Cover Note</h4>
                            <p className="text-sm text-gray-600 mt-1">{app.coverNote}</p>
                          </div>
                        )}

                        {app.user.studentProfile?.bio && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Bio</h4>
                            <p className="text-sm text-gray-600 mt-1">{app.user.studentProfile.bio}</p>
                          </div>
                        )}

                        {app.user.studentProfile?.skills && app.user.studentProfile.skills.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Skills</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {app.user.studentProfile.skills.map((skill) => (
                                <Badge key={skill} variant="default">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submitted Application Documents */}
                        {(app.resumeUrl || app.coverLetterUrl || app.transcriptUrl) && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Documents</h4>
                            <div className="flex flex-wrap gap-2">
                              {app.resumeUrl && (
                                <a
                                  href={app.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100"
                                >
                                  Resume
                                </a>
                              )}
                              {app.coverLetterUrl && (
                                <a
                                  href={app.coverLetterUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100"
                                >
                                  Cover Letter
                                </a>
                              )}
                              {app.transcriptUrl && (
                                <a
                                  href={app.transcriptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100"
                                >
                                  Transcript
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Profile Links */}
                        <div className="flex gap-3">
                          {app.user.studentProfile?.resumeUrl && (
                            <a
                              href={app.user.studentProfile.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Profile Resume
                            </a>
                          )}
                          {app.user.studentProfile?.linkedIn && (
                            <a
                              href={app.user.studentProfile.linkedIn}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              LinkedIn
                            </a>
                          )}
                          {app.user.studentProfile?.github && (
                            <a
                              href={app.user.studentProfile.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              GitHub
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSchedulingFor(app)}
                    >
                      Schedule Interview
                    </Button>
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                      {expandedId === app.id ? "Less" : "More"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {schedulingFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Schedule Interview with {schedulingFor.user.name}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              For: {schedulingFor.job.title}
            </p>

            {scheduleError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
                {scheduleError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propose Time Slots (at least 2)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  The candidate will pick one of these times
                </p>
                {timeSlots.map((slot, index) => (
                  <input
                    key={index}
                    type="datetime-local"
                    value={slot}
                    onChange={(e) => {
                      const newSlots = [...timeSlots];
                      newSlots[index] = e.target.value;
                      setTimeSlots(newSlots);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white mb-2"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSchedulingFor(null);
                  setScheduleError(null);
                  setTimeSlots(["", "", ""]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={scheduleInterview}
                disabled={scheduling}
                className="flex-1"
              >
                {scheduling ? "Sending..." : "Send Interview Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
