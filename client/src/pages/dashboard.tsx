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

  // Group patients by department
  const groupedPatients = patients.reduce((groups, patient) => {
    const dept = patient.department || "Unknown";
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(patient);
    return groups;
  }, {} as Record<string, Patient[]>);

  // Department labels mapping
  const departmentLabels = {
    "MW": "Medical Ward",
    "PVT": "Private Ward", 
    "GW": "Gynecology Ward",
    "SW": "Surgical Ward",
    "ER": "Emergency Room",
    "Unknown": "Unknown Department"
  };

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

        {/* Patient Cards by Department */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="patient-cards-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load patient cards</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8" data-testid="empty-patients-cards">
            <p className="text-muted-foreground">No patients to display. Add a new patient to get started.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPatients).map(([department, deptPatients]) => (
              <div key={department} className="space-y-4" data-testid={`department-${department}`}>
                {/* Department Header */}
                <div className="border-b border-border pb-2">
                  <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mr-3">
                      {department}
                    </span>
                    <span className="text-muted-foreground">
                      {departmentLabels[department as keyof typeof departmentLabels] || department}
                    </span>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {deptPatients.length} patient{deptPatients.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                </div>
                
                {/* Department Patient Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {deptPatients.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}