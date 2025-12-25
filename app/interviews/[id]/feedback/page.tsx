"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Feedback {
  id: string;
  clarityScore: number | null;
  pacingScore: number | null;
  engagementScore: number | null;
  suggestions: string | null;
}

interface Interview {
  id: string;
  status: string;
  scheduledAt: string | null;
  application: {
    job: {
      title: string;
      company: {
        name: string;
      };
    };
  };
  feedback: Feedback[];
}

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;

  const percentage = (score / 10) * 100;
  const color =
    score >= 8 ? "bg-green-500" : score >= 6 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-900 font-semibold">{score}/10</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function generateFeedback() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/analyze`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        fetchInterview(); // Refresh to get feedback
      } else {
        setError(data.error || "Failed to generate feedback");
      }
    } catch {
      setError("Failed to generate feedback");
    }

    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-600">{error || "Interview not found"}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/interviews")}>
              Back to Interviews
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feedback = interview.feedback[0];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => router.push("/interviews")} className="mb-6">
        ← Back to Interviews
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Interview Feedback</h1>
        <p className="text-gray-600">
          {interview.application.job.title} at {interview.application.job.company.name}
        </p>
        {interview.scheduledAt && (
          <p className="text-sm text-gray-500 mt-1">
            {new Date(interview.scheduledAt).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!feedback ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Feedback Not Yet Available
            </h2>
            <p className="text-gray-600 mb-6">
              {interview.status === "COMPLETED"
                ? "Click below to generate AI feedback based on your interview recording."
                : "Feedback will be available after the interview is complete."}
            </p>
            {interview.status === "COMPLETED" && (
              <Button
                variant="primary"
                onClick={generateFeedback}
                disabled={generating}
              >
                {generating ? "Analyzing Interview..." : "Generate Feedback"}
              </Button>
            )}
            {generating && (
              <p className="text-sm text-gray-500 mt-4">
                This may take a minute. We&apos;re transcribing and analyzing your interview...
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Communication Scores</h2>
            </CardHeader>
            <CardContent>
              <ScoreBar label="Clarity" score={feedback.clarityScore} />
              <ScoreBar label="Pacing" score={feedback.pacingScore} />
              <ScoreBar label="Engagement" score={feedback.engagementScore} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Suggestions for Improvement</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{feedback.suggestions}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This feedback is generated by AI based on communication
                patterns observed in your interview recording. Use it as a guide for improvement,
                not as a definitive assessment.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
