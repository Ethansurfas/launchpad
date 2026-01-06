"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CompanyReviewData {
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  studentReviews: {
    id: string;
    overall: number;
    wasGhosted: boolean;
    comment: string | null;
    createdAt: string;
    jobTitle: string;
  }[];
  aggregateRatings: {
    responsiveness: number;
    transparency: number;
    professionalism: number;
    interviewExperience: number;
    overall: number;
  } | null;
  ghostingRate: number;
  reviewCount: number;
  adminReview: {
    id: string;
    studentTreatment: number;
    feedbackTimeliness: number;
    hiringSuccess: number;
    wouldRecommend: number;
    comment: string | null;
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

function AdminReviewsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("company");

  const [data, setData] = useState<CompanyReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [ratings, setRatings] = useState({
    studentTreatment: 0,
    feedbackTimeliness: 0,
    hiringSuccess: 0,
    wouldRecommend: 0,
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    if (companyId) {
      fetchCompanyData();
    } else {
      setLoading(false);
    }
  }, [session, status, router, companyId]);

  async function fetchCompanyData() {
    const res = await fetch(`/api/admin/reviews?company=${companyId}`);
    if (res.ok) {
      const result = await res.json();
      setData(result);
      // Pre-fill form if admin already reviewed
      if (result.adminReview) {
        setRatings({
          studentTreatment: result.adminReview.studentTreatment,
          feedbackTimeliness: result.adminReview.feedbackTimeliness,
          hiringSuccess: result.adminReview.hiringSuccess,
          wouldRecommend: result.adminReview.wouldRecommend,
        });
        setComment(result.adminReview.comment || "");
      }
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allRated = Object.values(ratings).every((r) => r > 0);
    if (!allRated) {
      setError("Please rate all categories");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        ...ratings,
        comment: comment || null,
      }),
    });

    if (res.ok) {
      setSuccess("Review submitted successfully!");
      fetchCompanyData();
    } else {
      const result = await res.json();
      setError(result.error || "Failed to submit review");
    }

    setSubmitting(false);
  }

  if (status === "loading" || loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  if (!companyId) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Reviews</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Select a company from the dashboard to review.</p>
            <Link href="/admin">
              <Button className="mt-4">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Company not found.</p>
        <Link href="/admin" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-gray-500 hover:text-gray-700">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Review Employer</h1>
      </div>

      {/* Company Header */}
      <Card>
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            {data.company.logo ? (
              <img
                src={data.company.logo}
                alt={data.company.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-medium">
                {data.company.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{data.company.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                {data.aggregateRatings && (
                  <span className="flex items-center text-sm">
                    <span className="text-yellow-500">★</span>
                    <span className="text-gray-600 ml-1">
                      {data.aggregateRatings.overall} ({data.reviewCount} reviews)
                    </span>
                  </span>
                )}
                {data.ghostingRate > 0 && (
                  <Badge variant={data.ghostingRate > 25 ? "error" : "default"}>
                    {data.ghostingRate}% ghosting
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Reviews Summary */}
      {data.studentReviews.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Student Feedback Summary</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.aggregateRatings && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Responsiveness</span>
                  <span className="font-medium">{data.aggregateRatings.responsiveness}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transparency</span>
                  <span className="font-medium">{data.aggregateRatings.transparency}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Professionalism</span>
                  <span className="font-medium">{data.aggregateRatings.professionalism}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interview Experience</span>
                  <span className="font-medium">{data.aggregateRatings.interviewExperience}/5</span>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Recent Comments:</p>
              {data.studentReviews.filter((r) => r.comment).slice(0, 3).map((review) => (
                <div key={review.id} className="text-sm text-gray-600 mb-2 pl-3 border-l-2 border-gray-200">
                  <p className="italic">"{review.comment}"</p>
                  <p className="text-xs text-gray-400 mt-1">{review.jobTitle}</p>
                </div>
              ))}
              {data.studentReviews.filter((r) => r.comment).length === 0 && (
                <p className="text-sm text-gray-400 italic">No comments yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Review Form */}
      <Card className={data.adminReview ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            {data.adminReview ? "Update Your Review" : "Your Assessment"}
          </h3>
          <p className="text-sm text-gray-500">
            Rate this employer based on their partnership with your career center
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">{success}</div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Student Treatment</p>
                  <p className="text-xs text-gray-500">Do they treat our students well?</p>
                </div>
                <StarRating
                  value={ratings.studentTreatment}
                  onChange={(v) => setRatings({ ...ratings, studentTreatment: v })}
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Feedback Timeliness</p>
                  <p className="text-xs text-gray-500">Provide timely responses?</p>
                </div>
                <StarRating
                  value={ratings.feedbackTimeliness}
                  onChange={(v) => setRatings({ ...ratings, feedbackTimeliness: v })}
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Hiring Follow-through</p>
                  <p className="text-xs text-gray-500">Do they actually hire?</p>
                </div>
                <StarRating
                  value={ratings.hiringSuccess}
                  onChange={(v) => setRatings({ ...ratings, hiringSuccess: v })}
                />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Would Recommend</p>
                  <p className="text-xs text-gray-500">Recommend to peer institutions?</p>
                </div>
                <StarRating
                  value={ratings.wouldRecommend}
                  onChange={(v) => setRatings({ ...ratings, wouldRecommend: v })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes (visible only to admins)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Add notes about this employer partnership..."
              />
            </div>

            <Button
              type="submit"
              disabled={submitting || !Object.values(ratings).every((r) => r > 0)}
            >
              {submitting ? "Submitting..." : data.adminReview ? "Update Review" : "Submit Review"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading...</div>}>
      <AdminReviewsContent />
    </Suspense>
  );
}
