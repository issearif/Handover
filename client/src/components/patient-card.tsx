import { useState } from "react";
import { Patient, UpdatePatient } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ChevronDown, Save, Trash2, Edit, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

interface PatientCardProps {
  patient: Patient;
}

export default function PatientCard({ patient }: PatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Editable fields state
  const [name, setName] = useState(patient.name || "");
  const [mrn, setMrn] = useState(patient.mrn || "");
  const [age, setAge] = useState(patient.age || "");
  const [sex, setSex] = useState(patient.sex || "");
  const [department, setDepartment] = useState(patient.department || "");
  const [bed, setBed] = useState(patient.bed || "");
  const [diagnosis, setDiagnosis] = useState(patient.diagnosis || "");
  const [doa, setDoa] = useState(patient.doa || "");
  const [medications, setMedications] = useState(patient.medications || "");
  const [tasks, setTasks] = useState(patient.tasks || "");
  const [notes, setNotes] = useState(patient.notes || "");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (updates: UpdatePatient) => {
      const response = await apiRequest("PATCH", `/api/patients/${patient.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient updated",
        description: "Patient information has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update patient",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/patients/${patient.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient archived",
        description: "Patient has been moved to archive.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete patient",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      name,
      mrn,
      age,
      sex,
      department,
      bed,
      diagnosis,
      doa,
      medications,
      tasks,
      notes,
    });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    // Reset all fields to original values
    setName(patient.name || "");
    setMrn(patient.mrn || "");
    setAge(patient.age || "");
    setSex(patient.sex || "");
    setDepartment(patient.department || "");
    setBed(patient.bed || "");
    setDiagnosis(patient.diagnosis || "");
    setDoa(patient.doa || "");
    setMedications(patient.medications || "");
    setTasks(patient.tasks || "");
    setNotes(patient.notes || "");
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const toggleExpanded = (e: React.MouseEvent) => {
    // Don't toggle if clicking on edit button or input fields
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div 
      className="patient-card bg-card rounded-lg border border-border shadow-sm overflow-hidden"
      data-testid={`patient-card-${patient.id}`}
    >
      <div 
        className="p-6 cursor-pointer" 
        onClick={toggleExpanded}
        data-testid={`card-header-${patient.id}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Patient Name - Always show as text in collapsed view */}
            <div className="mb-1">
              {isEditing && isExpanded ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg font-semibold"
                  placeholder="Patient name"
                  data-testid={`input-edit-name-${patient.id}`}
                />
              ) : (
                <h3 className="font-semibold text-lg text-foreground" data-testid={`patient-name-${patient.id}`}>
                  {patient.name}
                </h3>
              )}
            </div>
            
            {/* ID Number - Always show as text in collapsed view */}
            <div className="mb-3">
              {isEditing && isExpanded ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">ID Number:</span>
                  <Input
                    value={mrn}
                    onChange={(e) => setMrn(e.target.value)}
                    className="text-sm flex-1"
                    placeholder="ID Number"
                    data-testid={`input-edit-mrn-${patient.id}`}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground" data-testid={`patient-mrn-${patient.id}`}>
                  ID Number: {patient.mrn}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Age/Sex */}
              <div>
                <span className="text-muted-foreground">Age/Sex:</span>
                {isEditing && isExpanded ? (
                  <div className="flex space-x-1 mt-1">
                    <Input
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="text-sm w-16"
                      placeholder="Age"
                      data-testid={`input-edit-age-${patient.id}`}
                    />
                    <Select value={sex} onValueChange={setSex}>
                      <SelectTrigger className="w-16 text-sm" data-testid={`select-edit-sex-${patient.id}`}>
                        <SelectValue placeholder="Sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="O">O</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="ml-1 font-medium" data-testid={`patient-age-sex-${patient.id}`}>
                    {patient.age}/{patient.sex}
                  </span>
                )}
              </div>
              
              {/* Ward/Bed */}
              <div>
                <span className="text-muted-foreground">Ward/Bed:</span>
                {isEditing && isExpanded ? (
                  <div className="mt-1 space-y-1">
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="text-sm" data-testid={`select-edit-department-${patient.id}`}>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MW">Medical Ward (MW)</SelectItem>
                        <SelectItem value="PVT">Private Ward (PVT)</SelectItem>
                        <SelectItem value="GW">Gynecology Ward (GW)</SelectItem>
                        <SelectItem value="SW">Surgical Ward (SW)</SelectItem>
                        <SelectItem value="ER">Emergency Room (ER)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={bed}
                      onChange={(e) => setBed(e.target.value)}
                      className="text-sm"
                      placeholder="Bed number"
                      data-testid={`input-edit-bed-${patient.id}`}
                    />
                  </div>
                ) : (
                  <span className="ml-1 font-medium" data-testid={`patient-bed-${patient.id}`}>
                    {patient.department}-{patient.bed}
                  </span>
                )}
              </div>
              
              {/* Diagnosis */}
              <div className="col-span-2">
                <span className="text-muted-foreground">Diagnosis:</span>
                {isEditing && isExpanded ? (
                  <div className="mt-1">
                    <Input
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="text-sm"
                      placeholder="Primary diagnosis"
                      data-testid={`input-edit-diagnosis-${patient.id}`}
                    />
                    <Input
                      value={doa}
                      onChange={(e) => setDoa(e.target.value)}
                      type="date"
                      className="text-sm mt-2"
                      data-testid={`input-edit-doa-${patient.id}`}
                    />
                  </div>
                ) : (
                  <>
                    <span className="ml-1 font-medium" data-testid={`patient-diagnosis-${patient.id}`}>
                      {patient.diagnosis}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2" data-testid={`patient-doa-${patient.id}`}>
                      (DOA: {patient.doa})
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex space-x-2">
                <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      data-testid={`button-fullscreen-${patient.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[90vh] flex flex-col" data-testid={`fullscreen-dialog-${patient.id}`}>
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                        <span>{patient.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsFullScreen(false)}
                          data-testid={`button-close-fullscreen-${patient.id}`}
                        >
                          <Minimize2 className="h-4 w-4" />
                        </Button>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-2">
                        {/* Patient Information Section */}
                        <div className="space-y-6">
                          <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Patient Information</h3>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ID Number:</span>
                                <span className="font-medium" data-testid={`fullscreen-mrn-${patient.id}`}>{patient.mrn}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Age/Sex:</span>
                                <span className="font-medium" data-testid={`fullscreen-age-sex-${patient.id}`}>{patient.age}/{patient.sex}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ward/Bed:</span>
                                <span className="font-medium" data-testid={`fullscreen-bed-${patient.id}`}>{patient.department}-{patient.bed}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Date of Admission:</span>
                                <span className="font-medium" data-testid={`fullscreen-doa-${patient.id}`}>{patient.doa}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Diagnosis</h3>
                            <p className="text-sm leading-relaxed" data-testid={`fullscreen-diagnosis-${patient.id}`}>{patient.diagnosis || "No diagnosis recorded"}</p>
                          </div>
                        </div>
                        
                        {/* Clinical Information Section */}
                        <div className="space-y-6">
                          <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Medications (Abx/Other)</h3>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap" data-testid={`fullscreen-medications-${patient.id}`}>
                              {patient.medications || "No medications recorded"}
                            </div>
                          </div>
                          
                          <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Tasks</h3>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap" data-testid={`fullscreen-tasks-${patient.id}`}>
                              {patient.tasks || "No tasks recorded"}
                            </div>
                          </div>
                          
                          <div className="bg-muted/30 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-primary">Additional Notes</h3>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap" data-testid={`fullscreen-notes-${patient.id}`}>
                              {patient.notes || "No additional notes"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ChevronDown 
                className={cn(
                  "text-muted-foreground transition-transform h-4 w-4",
                  isExpanded && "rotate-180"
                )}
                data-testid={`expand-icon-${patient.id}`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Expandable Content */}
      <div className={cn(
        "expandable-content border-t border-border bg-muted/20",
        isExpanded && "expanded"
      )}>
        <div className="p-6 space-y-4">
          <div>
            <Label htmlFor={`medications-${patient.id}`} className="block text-sm font-medium text-foreground mb-2">
              Medications (Abx/Other)
            </Label>
            <Textarea
              id={`medications-${patient.id}`}
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              className="w-full"
              rows={2}
              placeholder="Enter medications..."
              data-testid={`textarea-medications-${patient.id}`}
            />
          </div>
          
          <div>
            <Label htmlFor={`tasks-${patient.id}`} className="block text-sm font-medium text-foreground mb-2">
              Tasks
            </Label>
            <Textarea
              id={`tasks-${patient.id}`}
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              className="w-full"
              rows={2}
              placeholder="Enter tasks..."
              data-testid={`textarea-tasks-${patient.id}`}
            />
          </div>
          
          <div>
            <Label htmlFor={`notes-${patient.id}`} className="block text-sm font-medium text-foreground mb-2">
              Additional Notes
            </Label>
            <Textarea
              id={`notes-${patient.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
              rows={3}
              placeholder="Add any additional notes here..."
              data-testid={`textarea-notes-${patient.id}`}
            />
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  size="sm"
                  data-testid={`button-edit-${patient.id}`}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
              ) : (
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="sm"
                  data-testid={`button-cancel-${patient.id}`}
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              )}
              
              {isEditing && (
                <Button 
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid={`button-save-${patient.id}`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  data-testid={`button-delete-${patient.id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Patient
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-testid="delete-confirmation-modal">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center">
                    ⚠️ Confirm Deletion
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this patient? The patient will be moved to the archive for 7 days before permanent deletion.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-delete"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleteMutation.isPending ? "Deleting..." : "Delete Patient"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}