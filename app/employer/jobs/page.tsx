"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  location: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "CONTRACT";
  isActive: boolean;
  createdAt: string;
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

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const res = await fetch("/api/employer/jobs");
    if (res.ok) {
      const data = await res.json();
      setJobs(data);
    }
    setLoading(false);
  }

  async function toggleJobStatus(jobId: string, isActive: boolean) {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });

    if (res.ok) {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, isActive: !isActive } : job
        )
      );
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Listings</h1>
          <p className="text-gray-600 mt-1">Manage your job postings</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button>Post New Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t posted any jobs yet.</p>
            <Link href="/employer/jobs/new">
              <Button>Post Your First Job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="py-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <Badge variant={job.isActive ? "success" : "default"}>
                        {job.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span>{job.location}</span>
                      <span>{jobTypeLabels[job.type]}</span>
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/employer/applicants?job=${job.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {job._count.applications} applicant{job._count.applications !== 1 ? "s" : ""}
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleJobStatus(job.id, job.isActive)}
                    >
                      {job.isActive ? "Deactivate" : "Activate"}
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
