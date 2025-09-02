import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit2, Check, X, ArrowLeft, Trash2 } from "lucide-react";

interface DailyProgress {
  id: string;
  patientId: string;
  date: string;
  notes: string;
  createdAt: string;
}

interface Patient {
  id: string;
  name: string;
  mrn: string;
  age: string;
  sex: string;
  department: string;
  bed: string;
  diagnosis: string;
  doa: string;
  medications?: string;
  tasks?: string;
  notes?: string;
}

export default function PatientDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newProgressNote, setNewProgressNote] = useState("");
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState("");
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<Patient>>({});

  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError,
  } = useQuery({
    queryKey: ["/api/patients", params?.id],
    enabled: !!params?.id,
  });

  const {
    data: progressData,
    isLoading: progressLoading,
  } = useQuery({
    queryKey: ["/api/patients", params?.id, "progress"],
    enabled: !!params?.id,
  });

  const addProgressMutation = useMutation({
    mutationFn: async (progressData: Omit<DailyProgress, "id" | "createdAt">) => {
      const response = await apiRequest("POST", `/api/patients/${params?.id}/progress`, progressData);
      return response.json();
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
      const response = await apiRequest("PATCH", `/api/patients/${params?.id}/progress/${id}`, { notes });
      return response.json();
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
      const response = await apiRequest("PATCH", `/api/patients/${patientData.id}`, patientData);
      return response.json();
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

  const deletePatientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/patients/${params?.id}`);
      return response.json();
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

  const handleAddProgress = () => {
    if (!newProgressNote.trim()) {
      toast({
        title: "Error",
        description: "Progress notes are required",
        variant: "destructive",
      });
      return;
    }

    addProgressMutation.mutate({
      patientId: params!.id,
      date: new Date().toISOString().split('T')[0],
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
    setIsEditingPatient(true);
    setEditedPatient({ ...patient });
  };

  const handleSavePatient = () => {
    updatePatientMutation.mutate({
      id: patient!.id,
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Information Card */}
        <Card className="mb-6" data-testid="patient-info-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {patient.name}
              </CardTitle>
              {!isEditingPatient ? (
                <Button
                  onClick={handleEditPatient}
                  variant="ghost"
                  size="sm"
                  data-testid="button-edit-patient"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSavePatient}
                    disabled={updatePatientMutation.isPending}
                    size="sm"
                    data-testid="button-save-patient"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleCancelEditPatient}
                    variant="ghost"
                    size="sm"
                    data-testid="button-cancel-edit-patient"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">MRN</Label>
                {isEditingPatient ? (
                  <Input
                    value={editedPatient.mrn || patient.mrn}
                    onChange={(e) => setEditedPatient({ ...editedPatient, mrn: e.target.value })}
                    className="text-sm font-mono"
                    data-testid="input-edit-mrn"
                  />
                ) : (
                  <p className="text-sm font-mono">{patient.mrn}</p>
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
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <p className="text-sm">Active</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Days Since Admission</Label>
                <p className="text-sm">{calculateDaysSinceAdmission(patient.doa)} days</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Add Daily Progress */}
        <Card className="mb-6" data-testid="add-progress-card">
          <CardHeader>
            <CardTitle>Add Daily Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="progress-notes" className="block text-sm font-medium mb-2">
                Progress Notes *
              </Label>
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

        {/* Daily Progress History */}
        <Card data-testid="progress-history-card">
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
            ) : progressData && progressData.length > 0 ? (
              <div className="space-y-4">
                {progressData.map((entry: DailyProgress) => (
                  <div key={entry.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Label className="text-xs font-medium text-muted-foreground">Progress Notes</Label>
                          {editingProgress === entry.id ? (
                            <div className="mt-1">
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
                            <p className="text-sm mt-1">{entry.notes}</p>
                          )}
                        </div>
                        {editingProgress !== entry.id && (
                          <Button
                            onClick={() => handleEditProgress(entry)}
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            data-testid={`button-edit-progress-${entry.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
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
      </div>
    </div>
  );
}