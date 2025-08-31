import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Undo, Trash2, Archive } from "lucide-react";
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

export default function ArchivePage() {
  const { data: archivedPatients = [], isLoading, error } = useQuery<Patient[]>({
    queryKey: ["/api/patients/archived"],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await apiRequest("POST", `/api/patients/${patientId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/archived"] });
      toast({
        title: "Patient restored",
        description: "Patient has been restored from archive.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore patient",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await apiRequest("DELETE", `/api/patients/${patientId}/permanent`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients/archived"] });
      toast({
        title: "Patient permanently deleted",
        description: "Patient has been permanently removed from the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to permanently delete patient",
        variant: "destructive",
      });
    },
  });

  const formatDeletedTime = (deletedAt: Date | null) => {
    if (!deletedAt) return "Unknown";
    
    const now = new Date();
    const deleted = new Date(deletedAt);
    const diffTime = Math.abs(now.getTime() - deleted.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "1 day ago";
    } else {
      return `${diffDays} days ago`;
    }
  };

  const handleRestore = (patientId: string) => {
    restoreMutation.mutate(patientId);
  };

  const handlePermanentDelete = (patientId: string) => {
    permanentDeleteMutation.mutate(patientId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center" data-testid="archive-title">
                <Archive className="mr-2 text-muted-foreground h-5 w-5" />
                Archived Patients
                <span className="ml-2 text-sm text-muted-foreground">
                  (Deleted within 7 days)
                </span>
              </h3>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading archived patients: {error.message}</p>
              </div>
            ) : archivedPatients.length === 0 ? (
              <div 
                className="text-center text-muted-foreground py-8" 
                data-testid="empty-archive-message"
              >
                <Archive className="text-2xl mb-2 mx-auto h-8 w-8" />
                <p>No archived patients</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="archived-patients-list">
                {archivedPatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="bg-muted/50 border border-border rounded-lg p-4"
                    data-testid={`archived-patient-${patient.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-foreground" data-testid={`archived-name-${patient.id}`}>
                            {patient.name}
                          </h4>
                          <span className="archive-badge" data-testid={`archived-time-${patient.id}`}>
                            Deleted {formatDeletedTime(patient.deletedAt)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span data-testid={`archived-mrn-${patient.id}`}>MRN: {patient.mrn}</span> • 
                          <span className="ml-1" data-testid={`archived-age-sex-${patient.id}`}>{patient.age}/{patient.sex}</span> • 
                          <span className="ml-1" data-testid={`archived-bed-${patient.id}`}>{patient.bed}</span> • 
                          <span className="ml-1" data-testid={`archived-diagnosis-${patient.id}`}>{patient.diagnosis}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleRestore(patient.id)}
                          disabled={restoreMutation.isPending}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          data-testid={`button-restore-${patient.id}`}
                        >
                          <Undo className="mr-1 h-3 w-3" />
                          {restoreMutation.isPending ? "Restoring..." : "Restore"}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              data-testid={`button-permanent-delete-${patient.id}`}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete Forever
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent data-testid="permanent-delete-confirmation">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center">
                                ⚠️ Permanent Deletion
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. Are you sure you want to permanently delete this patient from the system?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-permanent-delete">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handlePermanentDelete(patient.id)}
                                disabled={permanentDeleteMutation.isPending}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid="button-confirm-permanent-delete"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {permanentDeleteMutation.isPending ? "Deleting..." : "Delete Forever"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
