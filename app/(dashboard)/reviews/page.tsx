"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Application {
  id: string;
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo: string | null;
    };
  };
  interviews: {
    id: string;
    status: string;
    scheduledAt: string | null;
  }[];
  review: {
    id: string;
    responsiveness: number;
    transparency: number;
    professionalism: number;
    interviewExperience: number;
    overall: number;
    wasGhosted: boolean;
    comment: string | null;
    createdAt: string;
  } | null;
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`text-2xl ${
            star <= value ? "text-yellow-400" : "text-gray-300"
          } ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  application,
  onSubmit,
  onCancel,
}: {
  application: Application;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [ratings, setRatings] = useState({
    responsiveness: 0,
    transparency: 0,
    professionalism: 0,
    interviewExperience: 0,
    overall: 0,
  });
  const [wasGhosted, setWasGhosted] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allRated = Object.values(ratings).every((r) => r > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRated) {
      setError("Please rate all categories");
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: application.id,
        ...ratings,
        wasGhosted,
        comment: comment || null,
      }),
    });

    if (res.ok) {
      onSubmit();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to submit review");
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">Responsiveness</p>
            <p className="text-xs text-gray-500">Did they communicate promptly?</p>
          </div>
          <StarRating
            value={ratings.responsiveness}
            onChange={(v) => setRatings({ ...ratings, responsiveness: v })}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">Transparency</p>
            <p className="text-xs text-gray-500">Clear about role, salary, timeline?</p>
          </div>
          <StarRating
            value={ratings.transparency}
            onChange={(v) => setRatings({ ...ratings, transparency: v })}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">Professionalism</p>
            <p className="text-xs text-gray-500">Respectful and prepared?</p>
          </div>
          <StarRating
            value={ratings.professionalism}
            onChange={(v) => setRatings({ ...ratings, professionalism: v })}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">Interview Experience</p>
            <p className="text-xs text-gray-500">Fair process, relevant questions?</p>
          </div>
          <StarRating
            value={ratings.interviewExperience}
            onChange={(v) => setRatings({ ...ratings, interviewExperience: v })}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900">Overall</p>
            <p className="text-xs text-gray-500">Overall impression</p>
          </div>
          <StarRating
            value={ratings.overall}
            onChange={(v) => setRatings({ ...ratings, overall: v })}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={wasGhosted}
            onChange={(e) => setWasGhosted(e.target.checked)}
            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <div>
            <p className="font-medium text-gray-900">I was ghosted</p>
            <p className="text-xs text-gray-500">No response after interview</p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comments (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          placeholder="Share your experience..."
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || !allRated}>
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function ReviewsPage() {
  const [pending, setPending] = useState<Application[]>([]);
  const [submitted, setSubmitted] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    const res = await fetch("/api/reviews");
    if (res.ok) {
      const data = await res.json();
      setPending(data.pending);
      setSubmitted(data.submitted);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const reviewingApp = pending.find((a) => a.id === reviewingId);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600">Rate your interview experiences to help other students</p>
      </div>

      {/* Review Form Modal */}
      {reviewingApp && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              {reviewingApp.job.company.logo ? (
                <img
                  src={reviewingApp.job.company.logo}
                  alt={reviewingApp.job.company.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                  {reviewingApp.job.company.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900">
                  Review {reviewingApp.job.company.name}
                </h2>
                <p className="text-sm text-gray-600">{reviewingApp.job.title}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ReviewForm
              application={reviewingApp}
              onSubmit={() => {
                setReviewingId(null);
                fetchReviews();
              }}
              onCancel={() => setReviewingId(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews */}
      {pending.length > 0 && !reviewingId && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Reviews ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((app) => (
              <Card key={app.id} className="border-yellow-200 bg-yellow-50">
                <CardContent className="py-5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {app.job.company.logo ? (
                        <img
                          src={app.job.company.logo}
                          alt={app.job.company.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                          {app.job.company.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {app.job.company.name}
                        </h3>
                        <p className="text-sm text-gray-600">{app.job.title}</p>
                      </div>
                    </div>
                    <Button onClick={() => setReviewingId(app.id)}>
                      Write Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Reviews */}
      {submitted.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Reviews ({submitted.length})
          </h2>
          <div className="space-y-4">
            {submitted.map((app) => (
              <Card key={app.id}>
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    {app.job.company.logo ? (
                      <img
                        src={app.job.company.logo}
                        alt={app.job.company.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                        {app.job.company.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {app.job.company.name}
                        </h3>
                        <div className="flex items-center text-yellow-500">
                          <span className="text-lg">★</span>
                          <span className="text-sm text-gray-600 ml-1">
                            {app.review?.overall}/5
                          </span>
                        </div>
                        {app.review?.wasGhosted && (
                          <Badge variant="error">Ghosted</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{app.job.title}</p>
                      {app.review?.comment && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{app.review.comment}"
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Reviewed {new Date(app.review!.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pending.length === 0 && submitted.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No reviews available yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Complete interviews to leave reviews for employers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
