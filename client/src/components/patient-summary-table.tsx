import { Patient } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PatientSummaryTableProps {
  patients: Patient[];
}

const getStatusClassName = (status: string) => {
  switch (status.toLowerCase()) {
    case 'stable':
      return 'status-stable';
    case 'critical':
      return 'status-critical';
    case 'monitoring':
      return 'status-monitoring';
    case 'discharge':
      return 'status-discharge';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function PatientSummaryTable({ patients }: PatientSummaryTableProps) {
  // Sort patients with MW first, then by department, then by bed number
  const sortedPatients = [...patients].sort((a, b) => {
    // Priority order: MW first, then others
    const departmentOrder = ["MW", "PVT", "GW", "SW", "ER"];
    const deptA = a.department || "Unknown";
    const deptB = b.department || "Unknown";
    
    const orderA = departmentOrder.indexOf(deptA);
    const orderB = departmentOrder.indexOf(deptB);
    
    if (orderA !== orderB) {
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    }
    
    // Same department, sort by bed number
    const bedA = parseInt(a.bed.replace(/\D/g, '')) || 0;
    const bedB = parseInt(b.bed.replace(/\D/g, '')) || 0;
    return bedA - bedB;
  });

  return (
    <div className="mb-8">
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden" data-testid="summary-table">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold text-foreground flex items-center" data-testid="summary-title">
            Patient Summary
            <span 
              className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full" 
              data-testid="patient-count"
            >
              {patients.length} Active
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Bed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Age/Sex
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Diagnosis/DOA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tasks
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {patients.length === 0 ? (
                <tr>
                  <td 
                    colSpan={5} 
                    className="px-6 py-8 text-center text-muted-foreground"
                    data-testid="empty-patients-message"
                  >
                    No patients currently registered
                  </td>
                </tr>
              ) : (
                sortedPatients.map((patient) => (
                  <tr 
                    key={patient.id} 
                    className="hover:bg-muted/50 transition-colors"
                    data-testid={`summary-row-${patient.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`bed-${patient.id}`}>
                      {patient.department}{patient.bed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground" data-testid={`name-${patient.id}`}>
                        {patient.name}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`mrn-${patient.id}`}>
                        MRN: {patient.mrn}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground" data-testid={`age-sex-${patient.id}`}>
                      {patient.age}/{patient.sex}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground" data-testid={`diagnosis-${patient.id}`}>
                        {patient.diagnosis}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`doa-${patient.id}`}>
                        DOA: {patient.doa}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground" data-testid={`tasks-${patient.id}`}>
                      {patient.tasks || "No pending tasks"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
