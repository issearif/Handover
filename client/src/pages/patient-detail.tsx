import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Patient } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Calendar, User, Stethoscope, Pill, ClipboardList, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyProgress {
  id: string;
  patientId: string;
  date: string;
  notes: string;
  vitals?: string;
  medications?: string;
  tasks?: string;
  createdAt: string;
}

export default function PatientDetail() {
  const [, params] = useRoute("/patient/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newProgressNote, setNewProgressNote] = useState("");
  const [newVitals, setNewVitals] = useState("");
  const [newMedications, setNewMedications] = useState("");
  const [newTasks, setNewTasks] = useState("");

  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: ["/api/patients", params?.id],
    enabled: !!params?.id,
  });

  const { data: progressEntries = [], isLoading: progressLoading } = useQuery<DailyProgress[]>({
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
      setNewVitals("");
      setNewMedications("");
      setNewTasks("");
      toast({
        title: "Progress added",
        description: "Daily progress has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add progress entry",
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
      vitals: newVitals || undefined,
      medications: newMedications || undefined,
      tasks: newTasks || undefined,
    });
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="text-center py-8">
            <p className="text-destructive">Patient not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="mb-6"
          data-testid="back-button"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Patient Information Card */}
        <Card className="mb-6" data-testid="patient-info-card">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <User className="mr-2 h-5 w-5" />
              {patient.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">ID Number</Label>
                <p className="font-medium">{patient.mrn}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Age/Sex</Label>
                <p className="font-medium">{patient.age}/{patient.sex}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Ward/Bed</Label>
                <p className="font-medium">{patient.department}-{patient.bed}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-muted-foreground">Diagnosis</Label>
                <p className="font-medium">{patient.diagnosis}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  Date of Admission
                </Label>
                <p className="font-medium">{patient.doa}</p>
                <p className="text-sm text-muted-foreground">
                  Day {calculateDaysSinceAdmission(patient.doa)} of admission
                </p>
              </div>
            </div>
            
            {/* Current Medical Information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <Pill className="mr-1 h-4 w-4" />
                  Current Medications
                </Label>
                <p className="text-sm mt-1">{patient.medications || "None recorded"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <ClipboardList className="mr-1 h-4 w-4" />
                  Current Tasks
                </Label>
                <p className="text-sm mt-1">{patient.tasks || "None recorded"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center">
                  <FileText className="mr-1 h-4 w-4" />
                  Notes
                </Label>
                <p className="text-sm mt-1">{patient.notes || "None recorded"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Daily Progress */}
        <Card className="mb-6" data-testid="add-progress-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Add Daily Progress
            </CardTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vitals" className="block text-sm font-medium mb-2">
                  Vitals
                </Label>
                <Input
                  id="vitals"
                  value={newVitals}
                  onChange={(e) => setNewVitals(e.target.value)}
                  placeholder="BP, HR, Temp, etc."
                  data-testid="input-vitals"
                />
              </div>
              <div>
                <Label htmlFor="medications-update" className="block text-sm font-medium mb-2">
                  Medication Changes
                </Label>
                <Input
                  id="medications-update"
                  value={newMedications}
                  onChange={(e) => setNewMedications(e.target.value)}
                  placeholder="New medications, dosage changes"
                  data-testid="input-medications"
                />
              </div>
              <div>
                <Label htmlFor="tasks-update" className="block text-sm font-medium mb-2">
                  Tasks/Orders
                </Label>
                <Input
                  id="tasks-update"
                  value={newTasks}
                  onChange={(e) => setNewTasks(e.target.value)}
                  placeholder="New tasks, lab orders"
                  data-testid="input-tasks"
                />
              </div>
            </div>

            <Button
              onClick={handleAddProgress}
              disabled={addProgressMutation.isPending || !newProgressNote.trim()}
              className="w-full sm:w-auto"
              data-testid="button-add-progress"
            >
              <Plus className="mr-2 h-4 w-4" />
              {addProgressMutation.isPending ? "Adding..." : "Add Progress Entry"}
            </Button>
          </CardContent>
        </Card>

        {/* Daily Progress History */}
        <Card data-testid="progress-history-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="mr-2 h-5 w-5" />
              Daily Progress History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : progressEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No progress entries recorded yet. Add the first entry above.
              </p>
            ) : (
              <div className="space-y-4">
                {progressEntries
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-border rounded-lg p-4 bg-muted/20"
                      data-testid={`progress-entry-${entry.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-foreground">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added: {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground">Progress Notes</Label>
                          <p className="text-sm">{entry.notes}</p>
                        </div>
                        
                        {(entry.vitals || entry.medications || entry.tasks) && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border">
                            {entry.vitals && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Vitals</Label>
                                <p className="text-xs">{entry.vitals}</p>
                              </div>
                            )}
                            {entry.medications && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Medications</Label>
                                <p className="text-xs">{entry.medications}</p>
                              </div>
                            )}
                            {entry.tasks && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">Tasks</Label>
                                <p className="text-xs">{entry.tasks}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}