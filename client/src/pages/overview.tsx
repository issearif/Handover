import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Overview() {
  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const sortedPatients = [...patients].sort((a, b) => {
    if (a.department !== b.department) {
      return a.department.localeCompare(b.department);
    }
    return a.bed.localeCompare(b.bed);
  });

  const handlePrint = () => {
    const printContent = document.getElementById("patient-overview-print");
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Overview - IM Handovers</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000;
              background: #fff;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              color: #000; 
            }
            .header p { 
              margin: 5px 0; 
              font-size: 14px; 
              color: #666; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              font-size: 12px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
              color: #000;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            .patient-name { 
              font-weight: bold; 
              color: #000;
            }
            .patient-id, .doa-text { 
              font-size: 10px; 
              color: #666; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              font-size: 10px; 
              color: #666; 
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .bed-col { width: 10%; }
            .patient-col { width: 25%; }
            .age-col { width: 15%; }
            .diagnosis-col { width: 35%; }
            .tasks-col { width: 15%; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Internal Medicine Department</h1>
            <p>Patient Overview - ${currentDate}</p>
            <p>Total Patients: ${patients.length}</p>
          </div>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Generated on ${currentDate} | Internal Medicine Handover System</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground" data-testid="overview-title">
              Patient Overview
            </h1>
            <span className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full" data-testid="overview-patient-count">
              {patients.length} patients
            </span>
          </div>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="no-print"
            data-testid="print-overview-button"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Overview
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden" data-testid="overview-table">
          <div className="overflow-x-auto">
            <table className="w-full" id="patient-overview-print">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bed-col">
                    Bed
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider patient-col">
                    Patient
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider age-col">
                    Age/Sex
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider diagnosis-col">
                    Diagnosis/DOA
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider tasks-col">
                    Tasks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {patients.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={5} 
                      className="px-3 py-8 text-center text-muted-foreground text-sm"
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
                      data-testid={`overview-row-${patient.id}`}
                    >
                      <td className="px-3 py-3 text-sm text-foreground font-medium bed-col" data-testid={`bed-${patient.id}`}>
                        {patient.department}{patient.bed}
                      </td>
                      <td className="px-3 py-3 patient-col">
                        <div className="font-medium text-sm text-foreground patient-name" data-testid={`name-${patient.id}`}>
                          {patient.name}
                        </div>
                        <div className="text-xs text-muted-foreground patient-id" data-testid={`mrn-${patient.id}`}>
                          ID: {patient.mrn}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground age-col" data-testid={`age-sex-${patient.id}`}>
                        {patient.age}/{patient.sex}
                      </td>
                      <td className="px-3 py-3 diagnosis-col">
                        <div className="text-sm text-foreground diagnosis-text" data-testid={`diagnosis-${patient.id}`}>
                          {patient.diagnosis}
                        </div>
                        <div className="text-xs text-muted-foreground doa-text" data-testid={`doa-${patient.id}`}>
                          {patient.doa}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-foreground tasks-col" data-testid={`tasks-${patient.id}`}>
                        {patient.tasks || "None"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}