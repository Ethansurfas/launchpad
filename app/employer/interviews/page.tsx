"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Interview {
  id: string;
  scheduledAt: string | null;
  duration: number;
  status: "PENDING_RESPONSE" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  application: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    job: {
      id: string;
      title: string;
    };
  };
  timeSlots: {
    id: string;
    startTime: string;
    selected: boolean;
  }[];
}

const statusConfig = {
  PENDING_RESPONSE: { label: "Awaiting Response", variant: "info" as const },
  SCHEDULED: { label: "Scheduled", variant: "success" as const },
  IN_PROGRESS: { label: "In Progress", variant: "success" as const },
  COMPLETED: { label: "Completed", variant: "default" as const },
  CANCELLED: { label: "Cancelled", variant: "error" as const },
};

export default function EmployerInterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  async function fetchInterviews() {
    const res = await fetch("/api/interviews");
    if (res.ok) {
      const data = await res.json();
      setInterviews(data);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const pendingInterviews = interviews.filter((i) => i.status === "PENDING_RESPONSE");
  const upcomingInterviews = interviews.filter(
    (i) => i.status === "SCHEDULED" || i.status === "IN_PROGRESS"
  );
  const pastInterviews = interviews.filter(
    (i) => i.status === "COMPLETED" || i.status === "CANCELLED"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
        <p className="text-gray-600">Manage your scheduled interviews</p>
      </div>

      {/* Pending Response */}
      {pendingInterviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Awaiting Candidate Response</h2>
          <div className="space-y-4">
            {pendingInterviews.map((interview) => (
              <Card key={interview.id}>
                <CardContent className="py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {interview.application.user.name}
                        </h3>
                        <Badge variant={statusConfig[interview.status].variant}>
                          {statusConfig[interview.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interview.application.job.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Proposed times: {interview.timeSlots.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingInterviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h2>
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => (
              <Card key={interview.id}>
                <CardContent className="py-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {interview.application.user.name}
                        </h3>
                        <Badge variant={statusConfig[interview.status].variant}>
                          {statusConfig[interview.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interview.application.job.title}
                      </p>
                      {interview.scheduledAt && (
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {new Date(interview.scheduledAt).toLocaleString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" · "}{interview.duration} min
                        </p>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => router.push(`/interviews/${interview.id}`)}
                    >
                      Join Interview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {pastInterviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past</h2>
          <div className="space-y-4">
            {pastInterviews.map((interview) => (
              <Card key={interview.id} className="opacity-75">
                <CardContent className="py-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {interview.application.user.name}
                        </h3>
                        <Badge variant={statusConfig[interview.status].variant}>
                          {statusConfig[interview.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interview.application.job.title}
                      </p>
                      {interview.scheduledAt && (
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(interview.scheduledAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {interview.status === "COMPLETED" && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/interviews/${interview.id}/feedback`)}
                      >
                        View Feedback
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {interviews.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No interviews scheduled yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Schedule interviews from the Applicants page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
