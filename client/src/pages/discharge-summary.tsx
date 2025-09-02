import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Patient } from "@/../../shared/schema";

interface Progress {
  id: string;
  notes: string;
  createdAt: string;
}

const DischargeSummary = () => {
  const { patientId } = useParams();
  const [, navigate] = useLocation();

  const {
    data: patient,
    isLoading: patientLoading,
    error: patientError
  } = useQuery<Patient>({
    queryKey: ["/api/patients", patientId],
    enabled: !!patientId,
  });

  const {
    data: progressEntries = [],
    isLoading: progressLoading,
  } = useQuery<Progress[]>({
    queryKey: ["/api/patients", patientId, "progress"],
    enabled: !!patientId,
  });

  // Calculate days since admission for progress grouping
  const calculateDaysSinceAdmission = (dateString: string, admissionDate: string) => {
    const date = new Date(dateString);
    const admission = new Date(admissionDate);
    const diffTime = Math.abs(date.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Group progress entries by admission day
  const groupProgressByDay = () => {
    if (!patient || !progressEntries.length) return {};
    
    const grouped: { [key: number]: Progress[] } = {};
    
    progressEntries.forEach(entry => {
      const day = calculateDaysSinceAdmission(entry.createdAt, patient.doa);
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(entry);
    });
    
    return grouped;
  };

  const handlePrint = () => {
    window.print();
  };

  if (patientLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-500">Error loading patient data</p>
          </div>
        </div>
      </div>
    );
  }

  const progressByDay = groupProgressByDay();

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Header - hidden in print */}
      <div className="print:hidden bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              onClick={() => navigate(`/patient/${patientId}`)}
              variant="ghost"
              size="sm"
              data-testid="back-to-patient"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patient
            </Button>
            <h1 className="text-xl font-bold">Discharge Summary</h1>
            <Button onClick={handlePrint} variant="outline" size="sm" data-testid="print-button">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:px-0 print:py-4">
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="print:pb-4">
            <CardTitle className="text-center text-2xl print:text-3xl">
              DISCHARGE SUMMARY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 print:space-y-4">
            {/* Patient Details */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg border-b pb-1">Patient Details</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {patient.name}</p>
                <p><strong>MRN:</strong> {patient.mrn}</p>
                <p><strong>Age:</strong> {patient.age} years</p>
                <p><strong>Sex:</strong> {patient.sex}</p>
                <p><strong>Ward/Bed:</strong> {patient.department}-{patient.bed}</p>
                <p><strong>Date of Admission:</strong> {new Date(patient.doa).toLocaleDateString()}</p>
                <p><strong>Diagnosis:</strong> {patient.diagnosis}</p>
              </div>
            </div>

            {/* Medications */}
            {patient.medications && patient.medications.trim() && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">Medications</h3>
                <p className="text-sm whitespace-pre-line">{patient.medications}</p>
              </div>
            )}

            {/* History of Present Illness */}
            {patient.historyOfPresentIllness && patient.historyOfPresentIllness.trim() && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">History of Present Illness</h3>
                <p className="text-sm whitespace-pre-line">{patient.historyOfPresentIllness}</p>
              </div>
            )}

            {/* Daily Progress */}
            {Object.keys(progressByDay).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">Daily Progress</h3>
                <div className="space-y-4">
                  {Object.entries(progressByDay)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([day, entries]) => (
                      <div key={day} className="space-y-2">
                        <h4 className="font-medium text-base">
                          {day === "1" ? "1st" : day === "2" ? "2nd" : day === "3" ? "3rd" : `${day}th`} day of admission:
                        </h4>
                        <div className="space-y-2 ml-4">
                          {entries.map((entry, index) => (
                            <p key={entry.id} className="text-sm whitespace-pre-line">
                              {entry.notes}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DischargeSummary;