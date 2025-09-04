import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit2, Check, X, ArrowLeft, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Patient, DailyProgress, HandoverTasks } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


export default function PatientDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newProgressNote, setNewProgressNote] = useState("");
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState("");
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<Patient>>({});
  const [isPatientDetailsExpanded, setIsPatientDetailsExpanded] = useState(false);
  const [handoverTasks, setHandoverTasks] = useState("");
  const [isEditingHandover, setIsEditingHandover] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
  } = useQuery<Patient>({
    queryKey: ["/api/patients", params?.id],
    enabled: !!params?.id,
  });

  const {
    data: progressData,
    isLoading: progressLoading,
  } = useQuery<DailyProgress[]>({
    queryKey: ["/api/patients", params?.id, "progress"],
    enabled: !!params?.id,
  });

  const {
    data: handoverData,
    isLoading: handoverLoading,
  } = useQuery<HandoverTasks[]>({
    queryKey: ["/api/patients", params?.id, "handover"],
    enabled: !!params?.id,
  });

  const addProgressMutation = useMutation({
    mutationFn: async (progressData: { patientId: string; date: string; notes: string }) => {
      return await apiRequest(`/api/patients/${params?.id}/progress`, { method: "POST", body: progressData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id, "progress"] });
      setNewProgressNote("");
      toast({
        title: "Progress added",
        description: "Daily progress has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add progress",
        variant: "destructive",
      });
    },
  });

  const editProgressMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest(`/api/patients/${params?.id}/progress/${id}`, { method: "PATCH", body: { notes } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id, "progress"] });
      setEditingProgress(null);
      setEditedNote("");
      toast({
        title: "Progress updated",
        description: "Progress note has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update progress note",
        variant: "destructive",
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (patientData: Partial<Patient> & { id: string }) => {
      return await apiRequest(`/api/patients/${patientData.id}`, { method: "PATCH", body: patientData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id] });
      setIsEditingPatient(false);
      setEditedPatient({});
      toast({
        title: "Patient updated",
        description: "Patient information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient information",
        variant: "destructive",
      });
    },
  });

  const deleteProgressMutation = useMutation({
    mutationFn: async (progressId: string) => {
      return await apiRequest(`/api/patients/${params?.id}/progress/${progressId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id, "progress"] });
      toast({
        title: "Progress entry deleted",
        description: "Daily progress entry has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete progress entry",
        variant: "destructive",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/patients/${params?.id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({
        title: "Patient deleted",
        description: "Patient has been successfully removed.",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete patient",
        variant: "destructive",
      });
    },
  });

  // Handover mutations
  const addHandoverMutation = useMutation({
    mutationFn: async (handoverData: { patientId: string; date: string; tasks: string; assignedShift: string }) => {
      return await apiRequest(`/api/patients/${params?.id}/handover`, { method: "POST", body: handoverData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id, "handover"] });
      setHandoverTasks("");
      toast({
        title: "Handover tasks added",
        description: "Tasks have been assigned to next shift successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add handover tasks",
        variant: "destructive",
      });
    },
  });

  const editHandoverMutation = useMutation({
    mutationFn: async ({ id, tasks }: { id: string; tasks: string }) => {
      return await apiRequest(`/api/patients/${params?.id}/handover/${id}`, { method: "PATCH", body: { tasks } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id, "handover"] });
      setIsEditingHandover(false);
      toast({
        title: "Handover tasks updated",
        description: "Tasks have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update handover tasks",
        variant: "destructive",
      });
    },
  });

  const deleteHandoverMutation = useMutation({
    mutationFn: async (handoverId: string) => {
      return await apiRequest(`/api/patients/${params?.id}/handover/${handoverId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", params?.id, "handover"] });
      toast({
        title: "Handover tasks deleted",
        description: "Tasks have been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete handover tasks",
        variant: "destructive",
      });
    },
  });

  const handleAddProgress = () => {
    if (!newProgressNote.trim()) {
      toast({
        title: "Error",
        description: "Progress notes are required",
        variant: "destructive",
      });
      return;
    }

    // Create date in Maldives timezone
    const maldivesDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Indian/Maldives'
    });
    
    if (!params?.id) {
      toast({
        title: "Error",
        description: "Patient ID is missing",
        variant: "destructive",
      });
      return;
    }

    addProgressMutation.mutate({
      patientId: params.id,
      date: maldivesDate,
      notes: newProgressNote,
    });
  };

  const handleEditProgress = (entry: DailyProgress) => {
    setEditingProgress(entry.id);
    setEditedNote(entry.notes);
  };

  const handleSaveEdit = () => {
    if (!editedNote.trim()) {
      toast({
        title: "Error",
        description: "Progress notes cannot be empty",
        variant: "destructive",
      });
      return;
    }

    editProgressMutation.mutate({
      id: editingProgress!,
      notes: editedNote,
    });
  };

  const handleCancelEdit = () => {
    setEditingProgress(null);
    setEditedNote("");
  };

  const handleEditPatient = () => {
    if (!patient) return;
    setIsEditingPatient(true);
    setEditedPatient({ ...patient });
  };

  const handleSavePatient = () => {
    if (!patient?.id) return;
    updatePatientMutation.mutate({
      id: patient.id,
      ...editedPatient,
    });
  };

  const handleCancelEditPatient = () => {
    setIsEditingPatient(false);
    setEditedPatient({});
  };

  const calculateDaysSinceAdmission = (doa: string) => {
    const admissionDate = new Date(doa);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handover handlers
  const handleAddHandover = () => {
    if (!handoverTasks.trim()) {
      toast({
        title: "Error",
        description: "Please enter handover tasks",
        variant: "destructive",
      });
      return;
    }

    if (!params?.id) {
      toast({
        title: "Error",
        description: "Patient ID is missing",
        variant: "destructive",
      });
      return;
    }

    // Get Maldives date
    const maldivesDate = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Indian/Maldives"
    });

    addHandoverMutation.mutate({
      patientId: params.id,
      date: maldivesDate,
      tasks: handoverTasks,
      assignedShift: "next"
    });
  };

  const handleEditHandover = (handover: HandoverTasks) => {
    setIsEditingHandover(true);
    setHandoverTasks(handover.tasks);
  };

  const handleSaveHandoverEdit = () => {
    setIsEditingHandover(false);
    toast({ title: "Saved", description: "Handover notes saved successfully." });
  };

  const handleCancelHandoverEdit = () => {
    setIsEditingHandover(false);
    setHandoverTasks("");
  };

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Frozen Ward/Bed Header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background">
        {/* Frozen Ward/Bed Header */}
        <div className="sticky top-0 z-50 bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Ward-Bed</h1>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              data-testid="back-button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <p className="text-destructive">Patient not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Frozen Ward/Bed Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground text-center flex-1">
            {patient?.department && patient?.bed ? `${patient.department}-${patient.bed} (DOA ${calculateDaysSinceAdmission(patient.doa)})` : 'Ward-Bed (DOA -)'}
          </h1>
          <Button
            onClick={() => deletePatientMutation.mutate()}
            variant="ghost"
            size="sm"
            disabled={deletePatientMutation.isPending}
            data-testid="delete-patient-button"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Collapsible Patient Summary */}
        <Card className="mb-3" data-testid="patient-summary">
          <CardContent className="p-4">
            <div 
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setIsPatientDetailsExpanded(!isPatientDetailsExpanded)}
              data-testid="patient-summary-toggle"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {patient.name} ({patient.age}{patient.sex}) - {patient.diagnosis}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                {!isPatientDetailsExpanded && !isEditingPatient && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPatient();
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {isPatientDetailsExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {isPatientDetailsExpanded && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Hospital ID</Label>
                {isEditingPatient ? (
                  <div className="space-y-2">
                    <Input
                      value={editedPatient.mrn || patient.mrn}
                      onChange={(e) => setEditedPatient({ ...editedPatient, mrn: e.target.value })}
                      className="text-sm font-mono"
                      data-testid="input-edit-mrn"
                      placeholder="Hospital ID"
                    />
                    <Input
                      value={editedPatient.nidPassport || patient.nidPassport || ""}
                      onChange={(e) => setEditedPatient({ ...editedPatient, nidPassport: e.target.value })}
                      className="text-sm font-mono"
                      data-testid="input-edit-nid-passport"
                      placeholder="NID/Passport"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-mono">{patient.mrn}</p>
                    {patient.nidPassport && (
                      <div>
                        <span className="text-xs text-muted-foreground">NID/Passport: </span>
                        <span className="text-sm font-mono">{patient.nidPassport}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                {isEditingPatient ? (
                  <Input
                    type="number"
                    value={editedPatient.age || patient.age}
                    onChange={(e) => setEditedPatient({ ...editedPatient, age: e.target.value })}
                    className="text-sm"
                    data-testid="input-edit-age"
                  />
                ) : (
                  <p className="text-sm">{patient.age} years</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Sex</Label>
                {isEditingPatient ? (
                  <select
                    value={editedPatient.sex || patient.sex}
                    onChange={(e) => setEditedPatient({ ...editedPatient, sex: e.target.value })}
                    className="text-sm border rounded px-2 py-1 w-full"
                    data-testid="select-edit-sex"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="text-sm">{patient.sex}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Ward/Bed</Label>
                {isEditingPatient ? (
                  <div className="flex space-x-2">
                    <select
                      value={editedPatient.department || patient.department}
                      onChange={(e) => setEditedPatient({ ...editedPatient, department: e.target.value })}
                      className="text-sm border rounded px-2 py-1 flex-1"
                      data-testid="select-edit-department"
                    >
                      <option value="MW">MW</option>
                      <option value="PVT">PVT</option>
                      <option value="GW">GW</option>
                      <option value="SW">SW</option>
                      <option value="ER">ER</option>
                    </select>
                    <Input
                      value={editedPatient.bed || patient.bed}
                      onChange={(e) => setEditedPatient({ ...editedPatient, bed: e.target.value })}
                      className="text-sm flex-1"
                      placeholder="Bed"
                      data-testid="input-edit-bed"
                    />
                  </div>
                ) : (
                  <p className="text-sm">{patient.department}-{patient.bed}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Date of Admission</Label>
                {isEditingPatient ? (
                  <Input
                    type="date"
                    value={editedPatient.doa || patient.doa}
                    onChange={(e) => setEditedPatient({ ...editedPatient, doa: e.target.value })}
                    className="text-sm"
                    data-testid="input-edit-doa"
                  />
                ) : (
                  <p className="text-sm">{new Date(patient.doa).toLocaleDateString()}</p>
                )}
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label className="text-sm font-medium text-muted-foreground">Diagnosis</Label>
                {isEditingPatient ? (
                  <Textarea
                    value={editedPatient.diagnosis || patient.diagnosis}
                    onChange={(e) => setEditedPatient({ ...editedPatient, diagnosis: e.target.value })}
                    className="text-sm"
                    rows={2}
                    data-testid="textarea-edit-diagnosis"
                  />
                ) : (
                  <p className="text-sm">{patient.diagnosis}</p>
                )}
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label className="text-sm font-medium text-muted-foreground">Medications</Label>
                {isEditingPatient ? (
                  <Textarea
                    value={editedPatient.medications || patient.medications || ""}
                    onChange={(e) => setEditedPatient({ ...editedPatient, medications: e.target.value })}
                    className="text-sm"
                    rows={2}
                    placeholder="List patient medications..."
                    data-testid="textarea-edit-medications"
                  />
                ) : (
                  <p className="text-sm">{patient.medications || "No medications listed"}</p>
                )}
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label className="text-sm font-medium text-muted-foreground">History of Present Illness</Label>
                {isEditingPatient ? (
                  <Textarea
                    value={editedPatient.historyOfPresentIllness || patient.historyOfPresentIllness || ""}
                    onChange={(e) => setEditedPatient({ ...editedPatient, historyOfPresentIllness: e.target.value })}
                    className="text-sm"
                    rows={3}
                    placeholder="Enter history of present illness..."
                    data-testid="textarea-edit-history"
                  />
                ) : (
                  <p className="text-sm">{patient.historyOfPresentIllness || "No history of present illness recorded"}</p>
                )}
              </div>
                </div>
                
                {isEditingPatient && (
                  <div className="flex justify-end mt-4">
                    <div className="flex space-x-2">
                      <Button onClick={handleSavePatient} disabled={updatePatientMutation.isPending} size="sm">
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancelEditPatient} variant="ghost" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Progress */}
        <Card className="mb-3" data-testid="add-progress-card">
          <CardHeader>
            <CardTitle>Daily Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                id="progress-notes"
                value={newProgressNote}
                onChange={(e) => setNewProgressNote(e.target.value)}
                placeholder="Enter daily progress notes, observations, patient condition changes..."
                rows={3}
                data-testid="textarea-progress-notes"
              />
            </div>

            <Button
              onClick={handleAddProgress}
              disabled={addProgressMutation.isPending}
              data-testid="button-add-progress"
            >
              {addProgressMutation.isPending ? "Adding..." : "Add Progress"}
            </Button>
          </CardContent>
        </Card>

        {/* Handovers */}
        <Card className="mb-3" data-testid="handover-card">
          <CardHeader>
            <CardTitle>Handovers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={handoverTasks}
              onChange={(e) => setHandoverTasks(e.target.value)}
              placeholder="Enter handover notes..."
              rows={3}
              disabled={!isEditingHandover}
              data-testid="textarea-handover-tasks"
            />
            
            {isEditingHandover ? (
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setIsEditingHandover(false);
                    toast({ title: "Saved", description: "Handover notes saved successfully." });
                  }}
                  size="sm"
                  data-testid="button-save-handover"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => {
                    setHandoverTasks("");
                    setIsEditingHandover(false);
                  }}
                  variant="ghost"
                  size="sm"
                  data-testid="button-cancel-handover"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditingHandover(true)}
                size="sm"
                data-testid="button-edit-handover"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Daily Progress History */}
        <Card className="mb-3" data-testid="progress-history-card">
          <CardHeader>
            <CardTitle>Daily Progress History</CardTitle>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : progressData && Array.isArray(progressData) && progressData.length > 0 ? (
              <div className="space-y-4">
                {progressData?.map((entry: DailyProgress) => (
                  <div key={entry.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {new Date(entry.date || new Date()).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          timeZone: "Indian/Maldives"
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.createdAt && new Date(entry.createdAt).toLocaleString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          timeZone: "Indian/Maldives",
                          hour12: true
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {editingProgress === entry.id ? (
                            <div>
                              <Textarea
                                value={editedNote}
                                onChange={(e) => setEditedNote(e.target.value)}
                                rows={3}
                                className="text-sm"
                                data-testid={`textarea-edit-${entry.id}`}
                              />
                              <div className="flex space-x-2 mt-2">
                                <Button
                                  onClick={handleSaveEdit}
                                  disabled={editProgressMutation.isPending}
                                  size="sm"
                                  data-testid={`button-save-edit-${entry.id}`}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-cancel-edit-${entry.id}`}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm">{entry.notes}</p>
                          )}
                        </div>
                        {editingProgress !== entry.id && (
                          <div className="flex space-x-1 ml-2">
                            <Button
                              onClick={() => handleEditProgress(entry)}
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-progress-${entry.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deleteProgressMutation.isPending}
                                  data-testid={`button-delete-progress-${entry.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Progress Entry</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this progress entry? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProgressMutation.mutate(entry.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No progress entries yet. Add the first entry above.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Prepare for Discharge Button */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={() => navigate(`/discharge-summary/${params?.id}`)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="prepare-discharge-button"
          >
            Prepare for Discharge
          </Button>
        </div>
      </div>
    </div>
  );
}