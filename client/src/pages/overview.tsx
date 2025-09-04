import { useQuery, useMutation } from "@tanstack/react-query";
import { Patient, HandoverTasks } from "@shared/schema";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Printer, ArrowLeft, Edit2, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export default function Overview() {
  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editingHandover, setEditingHandover] = useState<string | null>(null);
  const [handoverValues, setHandoverValues] = useState<{[key: string]: string}>({});
  const [editingPatient, setEditingPatient] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<{[key: string]: Partial<Patient>}>({});

  // Load handover data for all patients
  useEffect(() => {
    if (patients.length > 0) {
      const loadHandoverData = async () => {
        for (const patient of patients) {
          try {
            const maldivesDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Indian/Maldives" });
            const handoverData: HandoverTasks[] = await apiRequest(`/api/patients/${patient.id}/handover?date=${maldivesDate}`);
            if (handoverData.length > 0) {
              const latestHandover = handoverData[handoverData.length - 1];
              setHandoverValues(prev => ({
                ...prev,
                [patient.id]: latestHandover.tasks || ""
              }));
            }
          } catch (error) {
            console.error(`Error loading handover for patient ${patient.id}:`, error);
          }
        }
      };
      loadHandoverData();
    }
  }, [patients]);

  // Helper function to get handover for a patient
  const getHandoverForPatient = (patientId: string) => {
    return handoverValues[patientId] || "";
  };

  // Mutation for updating patient data
  const updatePatientMutation = useMutation({
    mutationFn: async ({ patientId, updates }: { patientId: string; updates: Partial<Patient> }) => {
      return await apiRequest(`/api/patients/${patientId}`, { method: "PATCH", body: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setEditingPatient(null);
      setEditedValues({});
      toast({ title: "Success", description: "Patient updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update patient", variant: "destructive" });
    },
  });

  // Mutation for updating handover
  const updateHandoverMutation = useMutation({
    mutationFn: async ({ patientId, tasks }: { patientId: string; tasks: string }) => {
      const maldivesDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Indian/Maldives" });
      return await apiRequest(`/api/patients/${patientId}/handover`, { 
        method: "POST", 
        body: { 
          patientId, 
          date: maldivesDate, 
          tasks, 
          assignedShift: "next" 
        } 
      });
    },
    onSuccess: (_, { patientId, tasks }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients", patientId, "handover"] });
      setEditingHandover(null);
      // Update local state immediately for smooth UX
      setHandoverValues(prev => ({
        ...prev,
        [patientId]: tasks
      }));
      toast({ title: "Success", description: "Handover updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update handover", variant: "destructive" });
    },
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
            .handover-col { width: 15%; }
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
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
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
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider handover-col">
                    Handover
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
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      data-testid={`overview-row-${patient.id}`}
                      onClick={() => navigate(`/patient/${patient.id}`)}
                    >
                      <td className="px-3 py-3 text-sm text-foreground font-medium bed-col" data-testid={`bed-${patient.id}`}>
                        {patient.department}{patient.bed}
                      </td>
                      <td className="px-3 py-3 patient-col" onClick={(e) => e.stopPropagation()}>
                        {editingPatient === patient.id ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editedValues[patient.id]?.name ?? patient.name}
                              onChange={(e) => setEditedValues(prev => ({
                                ...prev,
                                [patient.id]: { ...prev[patient.id], name: e.target.value }
                              }))}
                              className="w-full text-sm border border-border rounded px-2 py-1"
                              data-testid={`edit-name-${patient.id}`}
                            />
                            <input
                              type="text"
                              value={editedValues[patient.id]?.mrn ?? patient.mrn}
                              onChange={(e) => setEditedValues(prev => ({
                                ...prev,
                                [patient.id]: { ...prev[patient.id], mrn: e.target.value }
                              }))}
                              className="w-full text-xs border border-border rounded px-2 py-1"
                              placeholder="ID"
                              data-testid={`edit-mrn-${patient.id}`}
                            />
                            <div className="flex space-x-1">
                              <Button
                                onClick={() => updatePatientMutation.mutate({
                                  patientId: patient.id,
                                  updates: editedValues[patient.id] || {}
                                })}
                                size="sm"
                                className="h-6 px-2"
                                data-testid={`save-patient-${patient.id}`}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingPatient(null);
                                  setEditedValues(prev => ({ ...prev, [patient.id]: {} }));
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                data-testid={`cancel-patient-${patient.id}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between group">
                            <div>
                              <div className="font-medium text-sm text-foreground patient-name" data-testid={`name-${patient.id}`}>
                                {patient.name}
                              </div>
                              <div className="text-xs text-muted-foreground patient-id" data-testid={`mrn-${patient.id}`}>
                                ID: {patient.mrn}
                              </div>
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPatient(patient.id);
                                setEditedValues(prev => ({ ...prev, [patient.id]: {} }));
                              }}
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                              data-testid={`edit-patient-${patient.id}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
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
                      <td className="px-3 py-3 handover-col" onClick={(e) => e.stopPropagation()} data-testid={`handover-${patient.id}`}>
                        {editingHandover === patient.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={handoverValues[patient.id] || ""}
                              onChange={(e) => setHandoverValues(prev => ({
                                ...prev,
                                [patient.id]: e.target.value
                              }))}
                              placeholder="Enter handover notes..."
                              rows={2}
                              className="text-xs resize-none"
                              data-testid={`edit-handover-${patient.id}`}
                            />
                            <div className="flex space-x-1">
                              <Button
                                onClick={() => updateHandoverMutation.mutate({
                                  patientId: patient.id,
                                  tasks: handoverValues[patient.id] || ""
                                })}
                                size="sm"
                                className="h-6 px-2"
                                data-testid={`save-handover-${patient.id}`}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingHandover(null);
                                  setHandoverValues(prev => ({ ...prev, [patient.id]: "" }));
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                data-testid={`cancel-handover-${patient.id}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="group flex items-start justify-between">
                            <div className="text-xs text-foreground flex-1 pr-2">
                              {getHandoverForPatient(patient.id) || "No handover"}
                            </div>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingHandover(patient.id);
                                setHandoverValues(prev => ({
                                  ...prev,
                                  [patient.id]: getHandoverForPatient(patient.id)
                                }));
                              }}
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                              data-testid={`edit-handover-btn-${patient.id}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
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