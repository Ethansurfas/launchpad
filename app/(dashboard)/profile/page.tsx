"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Experience {
  id: string;
  company: string;
  title: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  technologies: string[];
}

interface Profile {
  id: string;
  email: string;
  name: string;
  studentProfile: {
    phone: string | null;
    location: string | null;
    workAuth: string | null;
    bio: string | null;
    university: string | null;
    major: string | null;
    minor: string | null;
    gradYear: number | null;
    gpa: number | null;
    coursework: string[];
    honors: string[];
    linkedIn: string | null;
    github: string | null;
    portfolio: string | null;
    resumeUrl: string | null;
    coverLetterUrl: string | null;
    transcriptUrl: string | null;
    skills: string[];
    experiences: Experience[];
    projects: Project[];
  } | null;
}

const workAuthLabels: Record<string, string> = {
  US_CITIZEN: "U.S. Citizen",
  PERMANENT_RESIDENT: "Permanent Resident",
  WORK_VISA: "Work Visa",
  STUDENT_VISA: "Student Visa (F-1/OPT)",
  REQUIRE_SPONSORSHIP: "Require Sponsorship",
  OTHER: "Other",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    workAuth: "",
    bio: "",
    university: "",
    major: "",
    minor: "",
    gradYear: "",
    gpa: "",
    coursework: [] as string[],
    honors: [] as string[],
    linkedIn: "",
    github: "",
    portfolio: "",
    resumeUrl: "",
    coverLetterUrl: "",
    transcriptUrl: "",
    skills: [] as string[],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newCoursework, setNewCoursework] = useState("");
  const [newHonor, setNewHonor] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || "",
        phone: data.studentProfile?.phone || "",
        location: data.studentProfile?.location || "",
        workAuth: data.studentProfile?.workAuth || "",
        bio: data.studentProfile?.bio || "",
        university: data.studentProfile?.university || "",
        major: data.studentProfile?.major || "",
        minor: data.studentProfile?.minor || "",
        gradYear: data.studentProfile?.gradYear?.toString() || "",
        gpa: data.studentProfile?.gpa?.toString() || "",
        coursework: data.studentProfile?.coursework || [],
        honors: data.studentProfile?.honors || [],
        linkedIn: data.studentProfile?.linkedIn || "",
        github: data.studentProfile?.github || "",
        portfolio: data.studentProfile?.portfolio || "",
        resumeUrl: data.studentProfile?.resumeUrl || "",
        coverLetterUrl: data.studentProfile?.coverLetterUrl || "",
        transcriptUrl: data.studentProfile?.transcriptUrl || "",
        skills: data.studentProfile?.skills || [],
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setActiveSection(null);
      } else {
        setError(data.error || "Failed to save profile");
        console.error("Save error:", data);
      }
    } catch (err) {
      setError("Network error - please try again");
      console.error("Save error:", err);
    }
    setSaving(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(type);
    setError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        const fieldName = type === "resume" ? "resumeUrl" : type === "coverLetter" ? "coverLetterUrl" : "transcriptUrl";
        setFormData((prev) => ({ ...prev, [fieldName]: data.url }));
        // Auto-save after upload
        const saveResult = await handleSaveAfterUpload(type, data.url);
        if (!saveResult) {
          setError("File uploaded but failed to save to profile");
        }
      } else {
        setError(data.error || "Failed to upload file");
      }
    } catch (err) {
      setError("Network error during upload");
      console.error("Upload error:", err);
    }

    setUploadingFile(null);
  }

  async function handleSaveAfterUpload(type: string, url: string): Promise<boolean> {
    const fieldName = type === "resume" ? "resumeUrl" : type === "coverLetter" ? "coverLetterUrl" : "transcriptUrl";
    const saveData = { ...formData, [fieldName]: url };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveData),
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(data);
        return true;
      } else {
        console.error("Save failed:", data.error);
        setError(`Save failed: ${data.error}`);
        return false;
      }
    } catch (err) {
      console.error("Auto-save error:", err);
      return false;
    }
  }

  function addItem(field: "skills" | "coursework" | "honors", value: string, setter: (v: string) => void) {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData((prev) => ({ ...prev, [field]: [...prev[field], value.trim()] }));
      setter("");
    }
  }

  function removeItem(field: "skills" | "coursework" | "honors", value: string) {
    setFormData((prev) => ({ ...prev, [field]: prev[field].filter((item) => item !== value) }));
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-gray-500">Profile not found</div>;
  }

  const p = profile.studentProfile;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Complete your profile to stand out to employers</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(activeSection === "basic" ? null : "basic")}>
            {activeSection === "basic" ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          {activeSection === "basic" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Authorization</label>
                  <select
                    value={formData.workAuth}
                    onChange={(e) => setFormData((prev) => ({ ...prev, workAuth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="US_CITIZEN">U.S. Citizen</option>
                    <option value="PERMANENT_RESIDENT">Permanent Resident</option>
                    <option value="WORK_VISA">Work Visa</option>
                    <option value="STUDENT_VISA">Student Visa (F-1/OPT)</option>
                    <option value="REQUIRE_SPONSORSHIP">Require Sponsorship</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Tell employers about yourself..."
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{profile.name}</p>
              <p className="text-gray-600">{profile.email}</p>
              {p?.phone && <p className="text-gray-600">{p.phone}</p>}
              {p?.location && <p className="text-gray-600">{p.location}</p>}
              {p?.workAuth && <p className="text-gray-600">{workAuthLabels[p.workAuth]}</p>}
              {p?.bio && <p className="text-gray-600 mt-2">{p.bio}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Education</h2>
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(activeSection === "education" ? null : "education")}>
            {activeSection === "education" ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          {activeSection === "education" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData((prev) => ({ ...prev, university: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minor</label>
                  <input
                    type="text"
                    value={formData.minor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={formData.gradYear}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gradYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gpa}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gpa: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="3.50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relevant Coursework</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCoursework}
                    onChange={(e) => setNewCoursework(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("coursework", newCoursework, setNewCoursework))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Add course"
                  />
                  <Button type="button" variant="secondary" onClick={() => addItem("coursework", newCoursework, setNewCoursework)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.coursework.map((course) => (
                    <Badge key={course} className="cursor-pointer" onClick={() => removeItem("coursework", course)}>{course} ×</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Honors & Awards</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newHonor}
                    onChange={(e) => setNewHonor(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("honors", newHonor, setNewHonor))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Add honor or award"
                  />
                  <Button type="button" variant="secondary" onClick={() => addItem("honors", newHonor, setNewHonor)}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.honors.map((honor) => (
                    <Badge key={honor} className="cursor-pointer" onClick={() => removeItem("honors", honor)}>{honor} ×</Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {p?.university && (
                <p className="font-medium text-gray-900">
                  {p.major}{p.minor && ` / ${p.minor}`} at {p.university}
                  {p.gradYear && ` (${p.gradYear})`}
                </p>
              )}
              {p?.gpa && <p className="text-gray-600">GPA: {p.gpa.toFixed(2)}</p>}
              {p?.coursework && p.coursework.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Coursework: </span>
                  <span className="text-gray-700">{p.coursework.join(", ")}</span>
                </div>
              )}
              {p?.honors && p.honors.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Honors: </span>
                  <span className="text-gray-700">{p.honors.join(", ")}</span>
                </div>
              )}
              {!p?.university && <p className="text-gray-400">No education info added</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Skills</h2>
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(activeSection === "skills" ? null : "skills")}>
            {activeSection === "skills" ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          {activeSection === "skills" ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem("skills", newSkill, setNewSkill))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="Add a skill"
                />
                <Button type="button" variant="secondary" onClick={() => addItem("skills", newSkill, setNewSkill)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} className="cursor-pointer" onClick={() => removeItem("skills", skill)}>{skill} ×</Badge>
                ))}
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {p?.skills && p.skills.length > 0 ? (
                p.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)
              ) : (
                <p className="text-gray-400">No skills added</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Documents</h2>
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(activeSection === "documents" ? null : "documents")}>
            {activeSection === "documents" ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          {activeSection === "documents" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Resume</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={(e) => handleFileUpload(e, "resume")}
                  className="w-full text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
                  disabled={uploadingFile === "resume"}
                />
                {uploadingFile === "resume" && <p className="text-sm text-gray-700 mt-1">Uploading...</p>}
                {formData.resumeUrl && <p className="text-sm text-green-700 mt-1 font-medium">Resume uploaded</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Cover Letter</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={(e) => handleFileUpload(e, "coverLetter")}
                  className="w-full text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
                  disabled={uploadingFile === "coverLetter"}
                />
                {uploadingFile === "coverLetter" && <p className="text-sm text-gray-700 mt-1">Uploading...</p>}
                {formData.coverLetterUrl && <p className="text-sm text-green-700 mt-1 font-medium">Cover letter uploaded</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Transcript</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt"
                  onChange={(e) => handleFileUpload(e, "transcript")}
                  className="w-full text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
                  disabled={uploadingFile === "transcript"}
                />
                {uploadingFile === "transcript" && <p className="text-sm text-gray-700 mt-1">Uploading...</p>}
                {formData.transcriptUrl && <p className="text-sm text-green-700 mt-1 font-medium">Transcript uploaded</p>}
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {p?.resumeUrl ? (
                <a href={p.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Resume</a>
              ) : (
                <p className="text-gray-600">No resume uploaded</p>
              )}
              {p?.coverLetterUrl && (
                <a href={p.coverLetterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Cover Letter</a>
              )}
              {p?.transcriptUrl && (
                <a href={p.transcriptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block">Transcript</a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Links</h2>
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(activeSection === "links" ? null : "links")}>
            {activeSection === "links" ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          {activeSection === "links" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkedIn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                <input
                  type="url"
                  value={formData.github}
                  onChange={(e) => setFormData((prev) => ({ ...prev, github: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
                <input
                  type="url"
                  value={formData.portfolio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, portfolio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  placeholder="https://yoursite.com"
                />
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          ) : (
            <div className="flex gap-4">
              {p?.linkedIn && <a href={p.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>}
              {p?.github && <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>}
              {p?.portfolio && <a href={p.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Portfolio</a>}
              {!p?.linkedIn && !p?.github && !p?.portfolio && <p className="text-gray-400">No links added</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Work Experience</h2>
        </CardHeader>
        <CardContent>
          {p?.experiences && p.experiences.length > 0 ? (
            <div className="space-y-4">
              {p.experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                  <h3 className="font-medium text-gray-900">{exp.title}</h3>
                  <p className="text-gray-600">{exp.company}{exp.location && ` · ${exp.location}`}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(exp.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })} - {" "}
                    {exp.current ? "Present" : exp.endDate && new Date(exp.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                  {exp.description && <p className="text-gray-600 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No work experience added</p>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Projects</h2>
        </CardHeader>
        <CardContent>
          {p?.projects && p.projects.length > 0 ? (
            <div className="space-y-4">
              {p.projects.map((project) => (
                <div key={project.id}>
                  <h3 className="font-medium text-gray-900">
                    {project.url ? (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">{project.name}</a>
                    ) : (
                      project.name
                    )}
                  </h3>
                  {project.description && <p className="text-gray-600">{project.description}</p>}
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="default">{tech}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No projects added</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
