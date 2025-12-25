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

                        <div className="flex gap-3">
                          {app.user.studentProfile?.resumeUrl && (
                            <a
                              href={app.user.studentProfile.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Resume
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
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </div>
  );
}
