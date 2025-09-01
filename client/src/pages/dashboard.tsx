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

  // Group patients by department with MW first priority
  const departmentOrder = ["MW", "PVT", "GW", "SW", "ER", "Unknown"];
  
  const groupedPatients = patients.reduce((groups, patient) => {
    const dept = patient.department || "Unknown";
    if (!groups[dept]) {
      groups[dept] = [];
    }
    groups[dept].push(patient);
    return groups;
  }, {} as Record<string, Patient[]>);
  
  // Sort each department's patients by bed number
  Object.keys(groupedPatients).forEach(dept => {
    groupedPatients[dept].sort((a, b) => {
      const bedA = parseInt(a.bed.replace(/\D/g, '')) || 0;
      const bedB = parseInt(b.bed.replace(/\D/g, '')) || 0;
      return bedA - bedB;
    });
  });

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
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" data-testid="patient-cards-grid">
            {Array.from({ length: 6 }).map((_, i) => (
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
            {departmentOrder
              .filter(dept => groupedPatients[dept] && groupedPatients[dept].length > 0)
              .map(department => {
                const deptPatients = groupedPatients[department];
                return (
                  <div key={department} className="space-y-4" data-testid={`department-${department}`}>
                {/* Department Header */}
                <div className="border-b border-border pb-3 mb-2">
                  <div className="flex items-center justify-center relative">
                    <div className={`
                      px-6 py-3 rounded-lg font-semibold text-lg shadow-sm border
                      ${department === 'MW' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                        department === 'PVT' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                        department === 'GW' ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800' :
                        department === 'SW' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                        department === 'ER' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800'}
                    `}>
                      {departmentLabels[department as keyof typeof departmentLabels] || department}
                    </div>
                    <span className="absolute right-0 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {deptPatients.length} patient{deptPatients.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {/* Department Patient Cards */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {deptPatients.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))}
                </div>
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}