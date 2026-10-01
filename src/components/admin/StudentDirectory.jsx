import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Image } from "@/components/ui/image";
import { base44 } from "@/api/base44Client";
import { formatMobile } from "@/lib/registration";

export default function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.StudentProfile
      .filter({}, { sort: "-registered_at", limit: 100 })
      .then((page) => setStudents(page.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mt-10">
      <h2 className="font-heading font-bold text-lg">Registered Students</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Unique identities created at registration. Names, emails and mobile numbers are checked for duplicates.
      </p>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg p-5">
            No students registered yet. New registrations appear here with their photo, User ID and verification status.
          </p>
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
            {students.map((student) => (
              <div key={student.id} className="flex items-start gap-4 p-4">
                <div className="w-12 h-12 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                  {student.photo_url ? (
                    <Image src={student.photo_url} alt={student.full_name} className="w-full h-full" fittingType="fill" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-semibold text-sm">{student.full_name}</p>
                    <span className="font-mono text-[11px] text-muted-foreground">{student.user_id}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        student.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {student.email} · {student.email_verified ? "email verified" : "email unverified"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMobile(student.mobile)} · {student.mobile_verified ? "mobile verified" : "mobile pending"}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {new Date(student.registered_at || student.created_date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}