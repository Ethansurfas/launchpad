"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          {applications.map((app) => (
            <Link key={app.id} href={`/jobs/${app.job.id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <CardContent className="py-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
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
                    </div>
                    <Badge variant={statusConfig[app.status].variant}>
                      {statusConfig[app.status].label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
