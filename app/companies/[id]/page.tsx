"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Company {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
  description: string | null;
  jobs: {
    id: string;
    title: string;
    location: string;
    type: string;
    createdAt: string;
  }[];
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
    reviewerInitial: string;
  }[] | null;
}

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
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
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium text-gray-900">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <StarDisplay value={value} />
      </div>
    </div>
  );
}

export default function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCompany() {
      const res = await fetch(`/api/companies/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data);
      } else {
        setError("Company not found");
      }
      setLoading(false);
    }
    fetchCompany();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (error || !company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || "Company not found"}</p>
        <Link href="/jobs" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Company Header */}
      <div className="flex items-start gap-6">
        {company.logo ? (
          <img
            src={company.logo}
            alt={company.name}
            className="w-24 h-24 rounded-xl object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-medium">
            {company.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            {company.aggregateRatings && (
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="text-2xl">★</span>
                <span className="text-xl font-semibold text-gray-900">
                  {company.aggregateRatings.overall.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({company.reviewCount} {company.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {company.website}
            </a>
          )}
          {company.description && (
            <p className="text-gray-600 mt-2">{company.description}</p>
          )}
          {company.ghostingRate > 25 && session && (
            <div className="mt-3">
              <Badge variant="error">
                {company.ghostingRate}% ghosting rate
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Ratings Breakdown */}
      {company.aggregateRatings && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Ratings Breakdown</h2>
            <p className="text-sm text-gray-500">Based on {company.reviewCount} student reviews</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <RatingBar
              label="Responsiveness"
              value={company.aggregateRatings.responsiveness}
              description="Did they communicate promptly?"
            />
            <RatingBar
              label="Transparency"
              value={company.aggregateRatings.transparency}
              description="Clear about role, salary, timeline?"
            />
            <RatingBar
              label="Professionalism"
              value={company.aggregateRatings.professionalism}
              description="Respectful and prepared?"
            />
            <RatingBar
              label="Interview Experience"
              value={company.aggregateRatings.interviewExperience}
              description="Fair process, relevant questions?"
            />
            <div className="border-t pt-4">
              <RatingBar
                label="Overall"
                value={company.aggregateRatings.overall}
                description="Overall impression"
              />
            </div>
            {company.ghostingRate > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">Ghosting Rate</span>
                    <p className="text-xs text-gray-500">No response after interview</p>
                  </div>
                  <span className={`font-semibold ${company.ghostingRate > 25 ? "text-red-600" : "text-gray-600"}`}>
                    {company.ghostingRate}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {company.reviews && company.reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Student Reviews ({company.reviews.length})
          </h2>
          <div className="space-y-4">
            {company.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {review.reviewerInitial}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{review.jobTitle}</span>
                          {review.wasGhosted && (
                            <Badge variant="error">Ghosted</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span>★</span>
                          <span className="text-sm text-gray-600">{review.overall}/5</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 mt-3 italic">"{review.comment}"</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs text-gray-500">
                    <span>Responsive: {review.responsiveness}/5</span>
                    <span>Transparent: {review.transparency}/5</span>
                    <span>Professional: {review.professionalism}/5</span>
                    <span>Interview: {review.interviewExperience}/5</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Login prompt for non-logged-in users */}
      {!session && company.reviewCount > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-6 text-center">
            <p className="text-gray-700">Sign in to see detailed student reviews</p>
            <Link href="/login">
              <Button className="mt-3">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* No reviews yet */}
      {company.reviewCount === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No reviews yet for this company.</p>
            <p className="text-sm text-gray-400 mt-1">
              Be the first to review after your interview!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Open Positions */}
      {company.jobs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Open Positions ({company.jobs.length})
          </h2>
          <div className="space-y-3">
            {company.jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-500">{job.location}</p>
                      </div>
                      <Badge variant="default">{job.type.replace("_", " ")}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
