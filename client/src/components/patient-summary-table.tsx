import { Patient } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PatientSummaryTableProps {
  patients: Patient[];
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

export default function PatientSummaryTable({ patients }: PatientSummaryTableProps) {
  // Sort patients with MW first, then by department, then by bed number
  const sortedPatients = [...patients].sort((a, b) => {
    // Priority order: MW first, then others
    const departmentOrder = ["MW", "PVT", "GW", "SW", "ER", "OPD"];
    const deptA = a.department || "Unknown";
    const deptB = b.department || "Unknown";
    
    const orderA = departmentOrder.indexOf(deptA);
    const orderB = departmentOrder.indexOf(deptB);
    
    if (orderA !== orderB) {
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    }
    
    // Same department, sort by bed number
    const bedA = parseInt(a.bed.replace(/\D/g, '')) || 0;
    const bedB = parseInt(b.bed.replace(/\D/g, '')) || 0;
    return bedA - bedB;
  });

  const handlePrint = () => {
    const printContent = document.getElementById('patient-summary-print');
    if (!printContent) return;
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Check if device is mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile devices, use a different approach
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        // Fallback for mobile browsers that block popups
        alert('Please enable popups for printing, or use the share button to send this page');
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Patient Summary - ${currentDate}</title>
            <style>
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 11px;
                line-height: 1.3;
                color: #000;
                margin: 0;
                padding: 10px;
                background: white;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
                margin-bottom: 15px;
              }
              .header h1 {
                margin: 0;
                font-size: 20px;
                font-weight: bold;
              }
              .header p {
                margin: 3px 0 0 0;
                font-size: 12px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                font-size: 10px;
              }
              th, td {
                border: 1px solid #000;
                padding: 6px 4px;
                text-align: left;
                vertical-align: top;
                word-wrap: break-word;
              }
              th {
                background-color: #f0f0f0;
                font-weight: bold;
                font-size: 9px;
              }
              .bed-col { width: 10%; }
              .patient-col { width: 25%; }
              .age-col { width: 12%; }
              .diagnosis-col { width: 35%; }
              .tasks-col { width: 18%; }
              .patient-name {
                font-weight: bold;
                margin-bottom: 1px;
                font-size: 10px;
              }
              .patient-id {
                font-size: 8px;
                color: #666;
              }
              .diagnosis-text {
                margin-bottom: 1px;
                font-size: 9px;
              }
              .doa-text {
                font-size: 8px;
                color: #666;
              }
              .footer {
                margin-top: 15px;
                text-align: center;
                font-size: 8px;
                color: #666;
                border-top: 1px solid #ccc;
                padding-top: 5px;
              }
              @media print {
                .no-print { display: none !important; }
                body { 
                  background: white;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .header h1 { font-size: 18px; }
                table { font-size: 9px; }
              }
              /* Mobile specific adjustments */
              @media screen and (max-width: 768px) {
                body { padding: 5px; }
                .header h1 { font-size: 18px; }
                table { font-size: 9px; }
                th, td { padding: 4px 2px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Internal Medicine Department</h1>
              <p>Patient Handover Summary - ${currentDate}</p>
              <p>Total Patients: ${patients.length}</p>
            </div>
            ${printContent.innerHTML}
            <div class="footer">
              <p>Generated on ${currentDate} | Internal Medicine Handover System</p>
            </div>
            <script>
              // Auto-print for mobile after content loads
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
              
              // Close window after printing (desktop) or user action (mobile)
              window.onafterprint = function() {
                setTimeout(function() {
                  window.close();
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } else {
      // Desktop version - original functionality
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Patient Summary - ${currentDate}</title>
            <style>
              @page {
                size: A4;
                margin: 20mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #000;
                margin: 0;
                padding: 0;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
              }
              .header p {
                margin: 5px 0 0 0;
                font-size: 14px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #f0f0f0;
                font-weight: bold;
                font-size: 11px;
              }
              .bed-col { width: 12%; }
              .patient-col { width: 25%; }
              .age-col { width: 15%; }
              .diagnosis-col { width: 30%; }
              .tasks-col { width: 18%; }
              .patient-name {
                font-weight: bold;
                margin-bottom: 2px;
              }
              .patient-id {
                font-size: 10px;
                color: #666;
              }
              .diagnosis-text {
                margin-bottom: 2px;
              }
              .doa-text {
                font-size: 10px;
                color: #666;
              }
              .footer {
                position: fixed;
                bottom: 10mm;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 10px;
                color: #666;
              }
              @media print {
                .no-print { display: none !important; }
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Internal Medicine Department</h1>
              <p>Patient Handover Summary - ${currentDate}</p>
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
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden" data-testid="summary-table">
        <Link href="/overview">
          <div 
            className="px-4 py-2 border-b border-border bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors" 
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center" data-testid="summary-title">
                View overview
                <span 
                  className="ml-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full" 
                  data-testid="patient-count"
                >
                  {patients.length}
                </span>
                <ChevronRight 
                  className="ml-2 text-muted-foreground h-4 w-4"
                  data-testid="view-overview-icon"
                />
              </h2>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
