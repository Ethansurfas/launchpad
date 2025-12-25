"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Interview {
  id: string;
  scheduledAt: string | null;
  duration: number;
  status: string;
  roomUrl: string | null;
  application: {
    user: {
      id: string;
      name: string;
    };
    job: {
      title: string;
      company: {
        name: string;
      };
    };
  };
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  async function fetchInterview() {
    const res = await fetch(`/api/interviews/${interviewId}`);
    if (res.ok) {
      const data = await res.json();
      setInterview(data);
    } else {
      setError("Interview not found");
    }
    setLoading(false);
  }

  const joinCall = useCallback(async () => {
    if (!interview) return;

    setJoining(true);
    setError(null);

    try {
      // Get or create the room
      const res = await fetch(`/api/interviews/${interviewId}/room`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to join call");
        setJoining(false);
        return;
      }

      const { roomUrl } = await res.json();

      // Create Daily call frame
      const frame = DailyIframe.createFrame(
        document.getElementById("call-container")!,
        {
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "0",
            borderRadius: "12px",
          },
          showLeaveButton: true,
          showFullscreenButton: true,
        }
      );

      frame.on("left-meeting", () => {
        frame.destroy();
        setInCall(false);
        setCallFrame(null);
        // Mark interview as complete
        completeInterview();
      });

      await frame.join({ url: roomUrl });
      setCallFrame(frame);
      setInCall(true);
    } catch (err) {
      console.error("Failed to join call:", err);
      setError("Failed to connect to video call");
    }

    setJoining(false);
  }, [interview, interviewId]);

  async function completeInterview() {
    // Update interview status to completed
    await fetch(`/api/interviews/${interviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    router.push("/interviews");
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [callFrame]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/interviews")}>
              Back to Interviews
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!interview) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-gray-900">
              Interview: {interview.application.job.title}
            </h1>
            <p className="text-sm text-gray-600">
              {interview.application.job.company.name}
              {interview.scheduledAt && (
                <span>
                  {" · "}
                  {new Date(interview.scheduledAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          {!inCall && (
            <Button variant="outline" onClick={() => router.push("/interviews")}>
              Back
            </Button>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!inCall ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Ready to join your interview?
                </h2>
                <p className="text-gray-600 mb-6">
                  Make sure your camera and microphone are working before joining.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  This call will be recorded for feedback purposes.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={joinCall}
                  disabled={joining}
                >
                  {joining ? "Connecting..." : "Join Interview"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div
            id="call-container"
            className="bg-black rounded-xl overflow-hidden"
            style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
          />
        )}
      </div>
    </div>
  );
}
