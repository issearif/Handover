import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import Header from "@/components/header";
import PatientSummaryTable from "@/components/patient-summary-table";
import PatientCard from "@/components/patient-card";
import AddPatientModal from "@/components/add-patient-modal";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: patients = [], isLoading, error } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Section */}
        {isLoading ? (
          <div className="mb-8">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="mb-8 p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive">Error loading patients: {error.message}</p>
          </div>
        ) : (
          <PatientSummaryTable patients={patients} />
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground" data-testid="patient-details-heading">
            Patient Details
          </h2>
          <AddPatientModal />
        </div>

        {/* Patient Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="patient-cards-grid">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))
          ) : error ? (
            <div className="col-span-full text-center py-8">
              <p className="text-destructive">Failed to load patient cards</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="col-span-full text-center py-8" data-testid="empty-patients-cards">
              <p className="text-muted-foreground">No patients to display. Add a new patient to get started.</p>
            </div>
          ) : (
            patients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
