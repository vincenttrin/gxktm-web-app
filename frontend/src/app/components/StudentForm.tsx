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

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    date_of_birth: "",
    allergies: "",
    gender: "",
    class_id: ""
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

    try {
      const response = await fetch("http://localhost:8000/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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
      <div className="w-full max-w-md rounded-lg bg-white/95 backdrop-blur-md p-6 shadow-xl text-black border border-white/20">
        <h2 className="mb-4 text-xl font-bold">Register New Student</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                required
                type="text"
                className="mt-1 w-full rounded border p-2"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                required
                type="text"
                className="mt-1 w-full rounded border p-2"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
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

          {/* Class Selection Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to Class</label>
            <select
              required
              className="mt-1 w-full rounded border p-2 bg-white"
              value={formData.class_id}
              onChange={(e) => setFormData({...formData, class_id: e.target.value})}
            >
              <option value="">-- Select a Class --</option>
              {programs.map((prog) => (
                <optgroup key={prog.id} label={prog.name}>
                  {prog.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
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