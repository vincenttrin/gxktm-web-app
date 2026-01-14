"use client"; // <--- This tells Next.js to run this in the browser, not the server

import { useEffect, useState } from "react";
import { Program } from "./types";
import StudentForm from "./components/StudentForm";
import { MOCK_PROGRAMS } from "../lib/mockData";

export default function Home() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // This function fetches the data when the page loads
    const fetchData = async () => {
      try {
        setPrograms(MOCK_PROGRAMS);
        // const res = await fetch("http://localhost:8000/programs");
        // const data = await res.json();
        // setPrograms(data);
      } catch (error) {
        console.error("Failed to fetch programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-gray-500">Loading Sunday School Data...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sunday School Dashboard</h1>
            <p className="text-gray-600">Overview of Programs and Classes</p>
          </div>
          <div>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              + New Student
            </button>
          </div>
        </header>

        {/* Student Form Modal */}
        {showForm && (
          <StudentForm 
            onCancel={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              window.location.reload(); // Simple refresh to update counts (we can optimize later)
            }}
          />
        )}

        {/* Grid Layout for Programs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <div 
              key={program.id} 
              className="overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Program Title */}
              <div className="bg-blue-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{program.name}</h2>
              </div>

              {/* List of Classes */}
              <div className="p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Classes / Divisions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {program.classes.length > 0 ? (
                    program.classes.map((cls) => (
                      <span 
                        key={cls.id} 
                        className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 border border-blue-100"
                      >
                        {cls.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">No classes yet</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}