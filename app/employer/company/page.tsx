"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Company {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  logo: string | null;
}

export default function CompanyPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchCompany();
  }, []);

  async function fetchCompany() {
    const res = await fetch("/api/employer/company");
    if (res.ok) {
      const data = await res.json();
      setCompany(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      website: formData.get("website") || null,
      description: formData.get("description") || null,
    };

    const res = await fetch("/api/employer/company", {
      method: company ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const updated = await res.json();
      setCompany(updated);
      setSuccess(company ? "Company updated successfully!" : "Company created successfully!");
    } else {
      const result = await res.json();
      setError(result.error || "Failed to save company");
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {company ? "Company Settings" : "Set Up Your Company"}
        </h1>
        <p className="text-gray-600 mt-1">
          {company
            ? "Update your company information"
            : "Create your company profile to start posting jobs"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Company Information</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={company?.name || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                name="website"
                type="url"
                defaultValue={company?.website || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={company?.description || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="Tell candidates about your company..."
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : company ? "Update Company" : "Create Company"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
