"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EmployerStats {
  id: string;
  name: string;
  logo: string | null;
  activeJobs: number;
  reviewCount: number;
  hasAdminReview: boolean;
  averageRating: number | null;
  ghostingRate: number;
  responsiveness: number | null;
  transparency: number | null;
  professionalism: number | null;
  interviewExperience: number | null;
}

interface Summary {
  totalEmployers: number;
  employersWithReviews: number;
  highGhostingEmployers: number;
  pendingAdminReviews: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [employers, setEmployers] = useState<EmployerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"rating" | "ghosting" | "reviews">("rating");

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [session, status, router]);

  async function fetchData() {
    const res = await fetch("/api/admin/employers");
    if (res.ok) {
      const data = await res.json();
      setSummary(data.summary);
      setEmployers(data.employers);
    }
    setLoading(false);
  }

  if (status === "loading" || loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  // Sort employers
  const sortedEmployers = [...employers].sort((a, b) => {
    if (sortBy === "rating") {
      return (b.averageRating ?? 0) - (a.averageRating ?? 0);
    } else if (sortBy === "ghosting") {
      return b.ghostingRate - a.ghostingRate;
    } else {
      return b.reviewCount - a.reviewCount;
    }
  });

  const flaggedEmployers = employers.filter((e) => e.ghostingRate > 25);
  const pendingReviewEmployers = employers.filter((e) => !e.hasAdminReview && e.reviewCount > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Career Center Dashboard</h1>
        <p className="text-gray-600">Monitor employer behavior and maintain partner quality</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{summary?.totalEmployers || 0}</p>
            <p className="text-sm text-gray-500">Total Employers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{summary?.employersWithReviews || 0}</p>
            <p className="text-sm text-gray-500">With Reviews</p>
          </CardContent>
        </Card>
        <Card className={summary?.highGhostingEmployers ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="py-5 text-center">
            <p className="text-3xl font-bold text-red-600">{summary?.highGhostingEmployers || 0}</p>
            <p className="text-sm text-gray-500">High Ghosting</p>
          </CardContent>
        </Card>
        <Card className={summary?.pendingAdminReviews ? "border-yellow-200 bg-yellow-50" : ""}>
          <CardContent className="py-5 text-center">
            <p className="text-3xl font-bold text-yellow-600">{summary?.pendingAdminReviews || 0}</p>
            <p className="text-sm text-gray-500">Pending Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Employers Alert */}
      {flaggedEmployers.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <h2 className="text-lg font-semibold text-red-800">Employers Flagged for High Ghosting</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {flaggedEmployers.map((e) => (
                <Link key={e.id} href={`/companies/${e.id}`}>
                  <Badge variant="error" className="cursor-pointer hover:opacity-80">
                    {e.name} ({e.ghostingRate}%)
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Reviews Alert */}
      {pendingReviewEmployers.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <h2 className="text-lg font-semibold text-yellow-800">Employers Awaiting Your Review</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingReviewEmployers.map((e) => (
                <Link key={e.id} href={`/admin/reviews?company=${e.id}`}>
                  <Badge variant="warning" className="cursor-pointer hover:opacity-80">
                    {e.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employer Rankings Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employer Rankings</h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "rating" | "ghosting" | "reviews")}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">Sort by Rating</option>
            <option value="ghosting">Sort by Ghosting Rate</option>
            <option value="reviews">Sort by Review Count</option>
          </select>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Company</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Rating</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Ghosting</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Reviews</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Active Jobs</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedEmployers.map((employer) => (
                  <tr key={employer.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {employer.logo ? (
                          <img
                            src={employer.logo}
                            alt={employer.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                            {employer.name.charAt(0)}
                          </div>
                        )}
                        <Link href={`/companies/${employer.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {employer.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {employer.averageRating ? (
                        <span className="flex items-center justify-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="text-gray-900">{employer.averageRating}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={employer.ghostingRate > 25 ? "text-red-600 font-medium" : "text-gray-600"}>
                        {employer.reviewCount > 0 ? `${employer.ghostingRate}%` : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {employer.reviewCount}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      {employer.activeJobs}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {employer.hasAdminReview ? (
                        <Badge variant="success">Reviewed</Badge>
                      ) : employer.reviewCount > 0 ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : (
                        <Badge variant="default">No Data</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/reviews?company=${employer.id}`}>
                        <Button variant="outline" size="sm">
                          {employer.hasAdminReview ? "View" : "Review"}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
