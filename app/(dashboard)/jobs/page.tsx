"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME" | "CONTRACT";
  salary: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
    reviewCount: number;
    averageRating: number | null;
    ghostingRate: number;
  };
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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchJobs();
  }, [typeFilter]);

  async function fetchJobs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/jobs?${params}`);
    const data = await res.json();
    setJobs(data);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchJobs();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Find Jobs</h1>
        <p className="text-gray-600 mt-1">Discover opportunities that match your skills</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit">Search</Button>
        </form>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="FULL_TIME">Full-time</option>
          <option value="PART_TIME">Part-time</option>
          <option value="CONTRACT">Contract</option>
        </select>
      </div>

      {/* Job Listings */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No jobs found. Try adjusting your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <CardContent className="py-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {job.company.logo ? (
                          <img
                            src={job.company.logo}
                            alt={job.company.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-medium">
                            {job.company.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600">{job.company.name}</p>
                            {job.company.averageRating && (
                              <span className="flex items-center text-sm">
                                <span className="text-yellow-500">★</span>
                                <span className="text-gray-600 ml-0.5">
                                  {job.company.averageRating}
                                </span>
                                <span className="text-gray-400 ml-0.5">
                                  ({job.company.reviewCount})
                                </span>
                              </span>
                            )}
                            {job.company.ghostingRate > 25 && (
                              <Badge variant="error" className="text-xs">
                                {job.company.ghostingRate}% ghosting
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                        <span>{job.location}</span>
                        {job.salary && <span>{job.salary}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="info">{jobTypeLabels[job.type]}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
