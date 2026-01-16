"use client";

import { useState, useEffect } from "react";
import { Program } from "../types";

interface StudentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StudentForm ({ onSuccess, onCancel }: StudentFormProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<Record<number, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    date_of_birth: "",
    allergies: "",
    gender: ""
  });

  // 1. Fetch Classes for the dropdown
  useEffect(() => {
    fetch("http://localhost:8000/programs")
      .then((res) => res.json() )
      .then((data) => setPrograms(data))
      .catch((error) => console.error("Error fetching programs:", error));
  }, []);

  // 2. Handle form input changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const class_ids = Object.values(selectedClasses).filter(Boolean);
    
    const payload = {
      ...formData,
      class_ids
    };

    try {
      const response = await fetch("http://localhost:8000/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create student");

      alert("Student created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 z-50">
      <div className="w-full max-w-md rounded-lg bg-white/95 backdrop-blur-md p-6 shadow-xl text-black border border-white/20 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-4 text-xl font-bold">Register New Student</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name*</label>
            <input
              required
              type="text"
              className="mt-1 w-full rounded border p-2"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Middle Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded border p-2"
              value={formData.middleName}
              onChange={(e) => setFormData({...formData, middleName: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name*</label>
            <input
              required
              type="text"
              className="mt-1 w-full rounded border p-2"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>

          {/* DOB */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              required
              type="date"
              className="mt-1 w-full rounded border p-2"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
            />
          </div>

          {/* DYNAMIC PROGRAM LOOP */}
          {/* This renders a dropdown for EVERY program in your database automatically */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Program Enrollment</h3>
            {programs.map((prog) => (
              <div key={prog.id}>
                <label className="block text-sm font-medium text-gray-700">
                  {prog.name}
                </label>
                <select
                  className="mt-1 w-full rounded border p-2 bg-white"
                  value={selectedClasses[prog.id] || ""}
                  onChange={(e) => 
                    setSelectedClasses({
                      ...selectedClasses, 
                      [prog.id]: e.target.value
                    })
                  }
                >
                  <option value="">-- No Enrollment --</option>
                  {prog.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>


           {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Allergies (Optional)</label>
            <input
              type="text"
              placeholder="Peanuts, Dairy, etc."
              className="mt-1 w-full rounded border p-2"
              value={formData.allergies}
              onChange={(e) => setFormData({...formData, allergies: e.target.value})}
            />
          </div>

            {/* Gender */}
            <div>
            <label className="block text-sm font-medium text-gray-700">Gender (Optional)</label>
            <select
              className="mt-1 w-full rounded border p-2 bg-white"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Register Student"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}