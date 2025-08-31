import { useState } from "react";
import { Patient, UpdatePatient } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ChevronDown, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

interface PatientCardProps {
  patient: Patient;
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

export default function PatientCard({ patient }: PatientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
      medications,
      tasks,
      notes,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
            <h3 className="font-semibold text-lg text-foreground mb-1" data-testid={`patient-name-${patient.id}`}>
              {patient.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3" data-testid={`patient-mrn-${patient.id}`}>
              MRN: {patient.mrn}
            </p>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Age/Sex:</span>
                <span className="ml-1 font-medium" data-testid={`patient-age-sex-${patient.id}`}>
                  {patient.age}/{patient.sex}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Bed:</span>
                <span className="ml-1 font-medium" data-testid={`patient-bed-${patient.id}`}>
                  {patient.bed}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Diagnosis:</span>
                <span className="ml-1 font-medium" data-testid={`patient-diagnosis-${patient.id}`}>
                  {patient.diagnosis}
                </span>
                <span className="text-xs text-muted-foreground ml-2" data-testid={`patient-doa-${patient.id}`}>
                  (DOA: {patient.doa})
                </span>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span 
                className={cn(
                  "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                  getStatusClassName(patient.status)
                )}
                data-testid={`patient-status-${patient.id}`}
              >
                {patient.status}
              </span>
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
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid={`button-save-${patient.id}`}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            
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
