"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Interview {
  id: string;
  scheduledAt: string | null;
  duration: number;
  status: "PENDING_RESPONSE" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  application: {
    job: {
      title: string;
      company: {
        name: string;
        logo: string | null;
      };
    };
  };
  timeSlots: {
    id: string;
    startTime: string;
    selected: boolean;
  }[];
}

const statusConfig = {
  PENDING_RESPONSE: { label: "Select a Time", variant: "info" as const },
  SCHEDULED: { label: "Scheduled", variant: "success" as const },
  IN_PROGRESS: { label: "In Progress", variant: "success" as const },
  COMPLETED: { label: "Completed", variant: "default" as const },
  CANCELLED: { label: "Cancelled", variant: "error" as const },
};

export default function InterviewsPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingSlot, setSelectingSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  async function selectTimeSlot(interviewId: string, slotId: string) {
    setSubmitting(true);
    const res = await fetch(`/api/interviews/${interviewId}/select-slot`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });

    if (res.ok) {
      fetchInterviews();
      setSelectingSlot(null);
    }
    setSubmitting(false);
  }

  async function joinInterview(interviewId: string) {
    router.push(`/interviews/${interviewId}`);
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Interviews</h1>
        <p className="text-gray-600">View and manage your interview schedule</p>
      </div>

      {/* Pending - Need to select time */}
      {pendingInterviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Action Required</h2>
          <div className="space-y-4">
            {pendingInterviews.map((interview) => (
              <Card key={interview.id} className="border-blue-200 bg-blue-50">
                <CardContent className="py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {interview.application.job.title}
                        </h3>
                        <Badge variant={statusConfig[interview.status].variant}>
                          {statusConfig[interview.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interview.application.job.company.name} · {interview.duration} min
                      </p>

                      {selectingSlot === interview.id ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Select a time:</p>
                          {interview.timeSlots.map((slot) => (
                            <Button
                              key={slot.id}
                              variant="outline"
                              size="sm"
                              onClick={() => selectTimeSlot(interview.id, slot.id)}
                              disabled={submitting}
                              className="mr-2 mb-2"
                            >
                              {new Date(slot.startTime).toLocaleString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </Button>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectingSlot(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">
                            {interview.timeSlots.length} time options available
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectingSlot(interview.id)}
                          >
                            Choose Time
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Interviews */}
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
                          {interview.application.job.title}
                        </h3>
                        <Badge variant={statusConfig[interview.status].variant}>
                          {statusConfig[interview.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interview.application.job.company.name}
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
                      onClick={() => joinInterview(interview.id)}
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

      {/* Past Interviews */}
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
                          {interview.application.job.title}
                        </h3>
                        <Badge variant={statusConfig[interview.status].variant}>
                          {statusConfig[interview.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interview.application.job.company.name}
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
              Apply to jobs and employers will invite you for interviews.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
