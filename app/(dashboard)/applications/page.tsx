"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Application {
  id: string;
  status: "PENDING" | "REVIEWING" | "INTERVIEW" | "OFFERED" | "REJECTED" | "WITHDRAWN";
  coverNote: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    location: string;
    type: string;
    company: {
      id: string;
      name: string;
      logo: string | null;
    };
  };
  interviews: {
    id: string;
    status: "PENDING_RESPONSE" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    scheduledAt: string | null;
  }[];
}

const statusConfig = {
  PENDING: { label: "Pending", variant: "default" as const },
  REVIEWING: { label: "Under Review", variant: "info" as const },
  INTERVIEW: { label: "Interview", variant: "success" as const },
  OFFERED: { label: "Offered", variant: "success" as const },
  REJECTED: { label: "Not Selected", variant: "error" as const },
  WITHDRAWN: { label: "Withdrawn", variant: "default" as const },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    const res = await fetch("/api/applications");
    if (res.ok) {
      const data = await res.json();
      setApplications(data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600 mt-1">Track the status of your job applications</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t applied to any jobs yet.</p>
            <Link
              href="/jobs"
              className="text-blue-600 hover:underline font-medium"
            >
              Browse jobs &rarr;
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const latestInterview = app.interviews[0];
            const canJoinInterview = latestInterview &&
              (latestInterview.status === "SCHEDULED" || latestInterview.status === "IN_PROGRESS");
            const needsTimeSelection = latestInterview?.status === "PENDING_RESPONSE";

            return (
              <Card key={app.id} className="hover:border-blue-300 transition-colors">
                <CardContent className="py-5">
                  <div className="flex justify-between items-start">
                    <Link href={`/jobs/${app.job.id}`} className="flex items-center gap-3 flex-1">
                      {app.job.company.logo ? (
                        <img
                          src={app.job.company.logo}
                          alt={app.job.company.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                          {app.job.company.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.job.title}</h3>
                        <p className="text-sm text-gray-600">{app.job.company.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3">
                      {canJoinInterview && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/interviews/${latestInterview.id}`);
                          }}
                        >
                          Join Interview
                        </Button>
                      )}
                      {needsTimeSelection && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push("/interviews");
                          }}
                        >
                          Select Time
                        </Button>
                      )}
                      <Badge variant={statusConfig[app.status].variant}>
                        {statusConfig[app.status].label}
                      </Badge>
                    </div>
                  </div>
                  {latestInterview?.scheduledAt && canJoinInterview && (
                    <p className="text-sm text-blue-600 mt-2 ml-15">
                      Interview: {new Date(latestInterview.scheduledAt).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
