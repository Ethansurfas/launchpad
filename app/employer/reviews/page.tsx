"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReviewsData {
  company: {
    id: string;
    name: string;
    logo: string | null;
  };
  reviewCount: number;
  aggregateRatings: {
    responsiveness: number;
    transparency: number;
    professionalism: number;
    interviewExperience: number;
    overall: number;
  } | null;
  ghostingRate: number;
  reviews: {
    id: string;
    responsiveness: number;
    transparency: number;
    professionalism: number;
    interviewExperience: number;
    overall: number;
    wasGhosted: boolean;
    comment: string | null;
    createdAt: string;
    jobTitle: string;
  }[];
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${
            star <= Math.round(value) ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
      <span className="text-sm text-gray-600 ml-1">{value.toFixed(1)}</span>
    </div>
  );
}

function RatingBar({ label, value, description }: { label: string; value: number; description: string }) {
  const percentage = (value / 5) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium text-gray-900">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <StarDisplay value={value} />
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${value >= 4 ? "bg-green-500" : value >= 3 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function EmployerReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "EMPLOYER") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [session, status, router]);

  async function fetchData() {
    const res = await fetch("/api/employer/reviews");
    if (res.ok) {
      const result = await res.json();
      setData(result);
    } else {
      const result = await res.json();
      setError(result.error || "Failed to load reviews");
    }
    setLoading(false);
  }

  if (status === "loading" || loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!session || session.user.role !== "EMPLOYER") {
    return null;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Reviews</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Reviews</h1>
        <p className="text-gray-600">See how candidates rate their experience with {data.company.name}</p>
      </div>

      {/* Overall Summary */}
      <Card className={data.ghostingRate > 25 ? "border-red-200" : data.reviewCount > 0 ? "border-green-200" : ""}>
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            {data.company.logo ? (
              <img
                src={data.company.logo}
                alt={data.company.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-medium">
                {data.company.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{data.company.name}</h2>
              {data.aggregateRatings ? (
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {data.aggregateRatings.overall.toFixed(1)}
                    </span>
                    <span className="text-2xl text-yellow-500">★</span>
                  </div>
                  <span className="text-gray-500">
                    from {data.reviewCount} {data.reviewCount === 1 ? "review" : "reviews"}
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 mt-2">No reviews yet</p>
              )}
              {data.ghostingRate > 0 && (
                <div className="mt-2">
                  <Badge variant={data.ghostingRate > 25 ? "error" : "warning"}>
                    {data.ghostingRate}% ghosting rate
                  </Badge>
                  {data.ghostingRate > 25 && (
                    <p className="text-xs text-red-600 mt-1">
                      High ghosting rate may deter candidates
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratings Breakdown */}
      {data.aggregateRatings && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Ratings Breakdown</h2>
            <p className="text-sm text-gray-500">How candidates rate different aspects of your process</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <RatingBar
              label="Responsiveness"
              value={data.aggregateRatings.responsiveness}
              description="Did you communicate promptly?"
            />
            <RatingBar
              label="Transparency"
              value={data.aggregateRatings.transparency}
              description="Were you clear about role, salary, timeline?"
            />
            <RatingBar
              label="Professionalism"
              value={data.aggregateRatings.professionalism}
              description="Were you respectful and prepared?"
            />
            <RatingBar
              label="Interview Experience"
              value={data.aggregateRatings.interviewExperience}
              description="Was the process fair with relevant questions?"
            />
          </CardContent>
        </Card>
      )}

      {/* Improvement Tips */}
      {data.aggregateRatings && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Tips to Improve</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              {data.aggregateRatings.responsiveness < 4 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Respond to candidates within 48 hours to improve responsiveness ratings</span>
                </li>
              )}
              {data.aggregateRatings.transparency < 4 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Include salary range and timeline expectations in job postings</span>
                </li>
              )}
              {data.aggregateRatings.professionalism < 4 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Review candidate materials before interviews and be on time</span>
                </li>
              )}
              {data.aggregateRatings.interviewExperience < 4 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Use consistent, job-relevant questions and provide feedback</span>
                </li>
              )}
              {data.ghostingRate > 10 && (
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span>Always send rejection emails - ghosting severely impacts your reputation</span>
                </li>
              )}
              {Object.values(data.aggregateRatings).every(r => r >= 4) && data.ghostingRate <= 10 && (
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>Great work! Your ratings are excellent. Keep it up!</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      {data.reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Individual Reviews ({data.reviews.length})
          </h2>
          <div className="space-y-4">
            {data.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{review.jobTitle}</span>
                        {review.wasGhosted && (
                          <Badge variant="error">Reported Ghosting</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-gray-600">{review.overall}/5 overall</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mt-3 italic bg-gray-50 p-3 rounded-lg">
                      "{review.comment}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                    <div className={`p-2 rounded ${review.responsiveness >= 4 ? "bg-green-50" : review.responsiveness >= 3 ? "bg-yellow-50" : "bg-red-50"}`}>
                      <p className="text-gray-500 text-xs">Responsive</p>
                      <p className="font-medium">{review.responsiveness}/5</p>
                    </div>
                    <div className={`p-2 rounded ${review.transparency >= 4 ? "bg-green-50" : review.transparency >= 3 ? "bg-yellow-50" : "bg-red-50"}`}>
                      <p className="text-gray-500 text-xs">Transparent</p>
                      <p className="font-medium">{review.transparency}/5</p>
                    </div>
                    <div className={`p-2 rounded ${review.professionalism >= 4 ? "bg-green-50" : review.professionalism >= 3 ? "bg-yellow-50" : "bg-red-50"}`}>
                      <p className="text-gray-500 text-xs">Professional</p>
                      <p className="font-medium">{review.professionalism}/5</p>
                    </div>
                    <div className={`p-2 rounded ${review.interviewExperience >= 4 ? "bg-green-50" : review.interviewExperience >= 3 ? "bg-yellow-50" : "bg-red-50"}`}>
                      <p className="text-gray-500 text-xs">Interview</p>
                      <p className="font-medium">{review.interviewExperience}/5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {data.reviews.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No reviews yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Reviews will appear here after candidates complete their interviews.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
