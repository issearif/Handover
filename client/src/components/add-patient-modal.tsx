import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPatientSchema, InsertPatient } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

export default function AddPatientModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      name: "",
      mrn: "",
      age: "",
      sex: undefined,
      bed: "",
      diagnosis: "",
      doa: "",
      status: undefined,
      medications: "",
      tasks: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      const response = await apiRequest("POST", "/api/patients", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient added",
        description: "New patient has been added successfully.",
      });
      form.reset();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add patient",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPatient) => {
    createMutation.mutate(data);
  };

  // Format today's date for the date input default
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-add-patient"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto" data-testid="add-patient-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Add New Patient
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter patient name" 
                        {...field} 
                        data-testid="input-patient-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mrn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRN *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Medical record number" 
                        {...field} 
                        data-testid="input-mrn"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Age" 
                        {...field} 
                        data-testid="input-age"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sex">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., IM-204A" 
                        {...field} 
                        data-testid="input-bed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Primary diagnosis" 
                        {...field} 
                        data-testid="input-diagnosis"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="doa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Admission *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        max={today}
                        {...field} 
                        data-testid="input-doa"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Stable">Stable</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Monitoring">Monitoring</SelectItem>
                      <SelectItem value="Discharge">Ready for Discharge</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medications (Abx/Other)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3}
                      placeholder="List current medications..." 
                      {...field} 
                      data-testid="textarea-medications"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tasks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasks</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3}
                      placeholder="Pending tasks and follow-ups..." 
                      {...field} 
                      data-testid="textarea-tasks"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-submit"
              >
                <Plus className="mr-2 h-4 w-4" />
                {createMutation.isPending ? "Adding..." : "Add Patient"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
