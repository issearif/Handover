// Patient Management System
class PatientManager {
    constructor() {
        this.patients = this.loadPatients();
        this.archivedPatients = this.loadArchivedPatients();
        this.currentPatientToDelete = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.render();
        
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
        
        // Clean up expired archived patients every hour
        setInterval(() => this.cleanupExpiredPatients(), 3600000);
        
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('archiveBtn').addEventListener('click', () => this.showArchive());
        document.getElementById('backToDashboard').addEventListener('click', () => this.showDashboard());

        // Add patient modal
        document.getElementById('addPatientBtn').addEventListener('click', () => this.showAddPatientModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideAddPatientModal());
        document.getElementById('cancelForm').addEventListener('click', () => this.hideAddPatientModal());

        // Form submission
        document.getElementById('addPatientForm').addEventListener('submit', (e) => this.handleAddPatient(e));

        // Delete confirmation modal
        document.getElementById('cancelDelete').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('confirmDelete').addEventListener('click', () => this.confirmDelete());

        // Close modal when clicking outside
        document.getElementById('addPatientModal').addEventListener('click', (e) => {
            if (e.target.id === 'addPatientModal') {
                this.hideAddPatientModal();
            }
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.hideDeleteModal();
            }
        });

        // Set max date for DOA to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('patientDOA').max = today;
    }

    // Data Management
    loadPatients() {
        const stored = localStorage.getItem('patients');
        return stored ? JSON.parse(stored) : [];
    }

    loadArchivedPatients() {
        const stored = localStorage.getItem('archivedPatients');
        return stored ? JSON.parse(stored) : [];
    }

    savePatients() {
        localStorage.setItem('patients', JSON.stringify(this.patients));
    }

    saveArchivedPatients() {
        localStorage.setItem('archivedPatients', JSON.stringify(this.archivedPatients));
    }

    generateId() {
        return 'patient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Patient Operations
    addPatient(patientData) {
        const patient = {
            id: this.generateId(),
            ...patientData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.patients.push(patient);
        this.savePatients();
        this.render();
        this.showSuccessMessage('Patient added successfully');
    }

    updatePatient(id, updates) {
        const index = this.patients.findIndex(p => p.id === id);
        if (index !== -1) {
            this.patients[index] = {
                ...this.patients[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.savePatients();
            this.render();
            this.showSuccessMessage('Patient updated successfully');
        }
    }

    deletePatient(id) {
        const patientIndex = this.patients.findIndex(p => p.id === id);
        if (patientIndex !== -1) {
            const patient = this.patients[patientIndex];
            patient.deletedAt = new Date().toISOString();
            
            this.archivedPatients.push(patient);
            this.patients.splice(patientIndex, 1);
            
            this.savePatients();
            this.saveArchivedPatients();
            this.render();
            this.showSuccessMessage('Patient moved to archive');
        }
    }

    restorePatient(id) {
        const archivedIndex = this.archivedPatients.findIndex(p => p.id === id);
        if (archivedIndex !== -1) {
            const patient = this.archivedPatients[archivedIndex];
            delete patient.deletedAt;
            patient.updatedAt = new Date().toISOString();
            
            this.patients.push(patient);
            this.archivedPatients.splice(archivedIndex, 1);
            
            this.savePatients();
            this.saveArchivedPatients();
            this.render();
            this.showSuccessMessage('Patient restored successfully');
        }
    }

    permanentlyDeletePatient(id) {
        const archivedIndex = this.archivedPatients.findIndex(p => p.id === id);
        if (archivedIndex !== -1) {
            this.archivedPatients.splice(archivedIndex, 1);
            this.saveArchivedPatients();
            this.render();
            this.showSuccessMessage('Patient permanently deleted');
        }
    }

    cleanupExpiredPatients() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const originalLength = this.archivedPatients.length;
        this.archivedPatients = this.archivedPatients.filter(patient => {
            if (patient.deletedAt) {
                const deletedDate = new Date(patient.deletedAt);
                return deletedDate > sevenDaysAgo;
            }
            return true;
        });
        
        if (this.archivedPatients.length !== originalLength) {
            this.saveArchivedPatients();
            this.render();
        }
    }

    // UI Operations
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('currentTime').textContent = timeString;
    }

    showDashboard() {
        document.getElementById('dashboardView').classList.add('active');
        document.getElementById('archiveView').classList.remove('active');
    }

    showArchive() {
        document.getElementById('archiveView').classList.add('active');
        document.getElementById('dashboardView').classList.remove('active');
    }

    showAddPatientModal() {
        document.getElementById('addPatientModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideAddPatientModal() {
        document.getElementById('addPatientModal').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('addPatientForm').reset();
    }

    showDeleteModal(patientId) {
        this.currentPatientToDelete = patientId;
        document.getElementById('deleteModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        document.body.style.overflow = '';
        this.currentPatientToDelete = null;
    }

    confirmDelete() {
        if (this.currentPatientToDelete) {
            this.deletePatient(this.currentPatientToDelete);
            this.hideDeleteModal();
        }
    }

    showSuccessMessage(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation CSS if not already present
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Event Handlers
    handleAddPatient(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const patientData = {
            name: document.getElementById('patientName').value.trim(),
            mrn: document.getElementById('patientMRN').value.trim(),
            age: document.getElementById('patientAge').value.trim(),
            sex: document.getElementById('patientSex').value,
            bed: document.getElementById('patientBed').value.trim(),
            diagnosis: document.getElementById('patientDiagnosis').value.trim(),
            doa: document.getElementById('patientDOA').value,
            status: document.getElementById('patientStatus').value,
            medications: document.getElementById('patientMedications').value.trim(),
            tasks: document.getElementById('patientTasks').value.trim(),
            notes: ''
        };

        // Validation
        if (!patientData.name || !patientData.mrn || !patientData.age || 
            !patientData.sex || !patientData.bed || !patientData.diagnosis || 
            !patientData.doa || !patientData.status) {
            alert('Please fill in all required fields');
            return;
        }

        // Check for duplicate MRN
        if (this.patients.some(p => p.mrn === patientData.mrn)) {
            alert('A patient with this MRN already exists');
            return;
        }

        this.addPatient(patientData);
        this.hideAddPatientModal();
    }

    handlePatientCardClick(patientId) {
        const card = document.querySelector(`[data-patient-id="${patientId}"]`);
        const content = card.querySelector('.patient-card-content');
        const icon = card.querySelector('.expand-icon');
        
        if (content.classList.contains('expanded')) {
            content.classList.remove('expanded');
            icon.classList.remove('expanded');
        } else {
            content.classList.add('expanded');
            icon.classList.add('expanded');
        }
    }

    handleSavePatient(patientId) {
        const card = document.querySelector(`[data-patient-id="${patientId}"]`);
        const medications = card.querySelector('.medications-textarea').value;
        const tasks = card.querySelector('.tasks-textarea').value;
        const notes = card.querySelector('.notes-textarea').value;
        
        this.updatePatient(patientId, { medications, tasks, notes });
    }

    // Rendering
    render() {
        this.renderSummaryTable();
        this.renderPatientCards();
        this.renderArchivedPatients();
        
        // Re-initialize Lucide icons after rendering
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 0);
    }

    renderSummaryTable() {
        const tbody = document.getElementById('summaryTableBody');
        const patientCount = document.getElementById('patientCount');
        
        patientCount.textContent = `${this.patients.length} Active`;
        
        if (this.patients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-message">No patients currently registered</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.patients.map(patient => `
            <tr>
                <td>
                    <div style="font-weight: 500; color: #1e293b;">${patient.name}</div>
                    <div style="font-size: 0.875rem; color: #64748b;">MRN: ${patient.mrn}</div>
                </td>
                <td>${patient.age}/${patient.sex}</td>
                <td>${patient.bed}</td>
                <td>
                    <div style="font-size: 0.875rem; color: #1e293b;">${patient.diagnosis}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">DOA: ${patient.doa}</div>
                </td>
                <td><span class="status-badge status-${patient.status.toLowerCase()}">${patient.status}</span></td>
                <td style="font-size: 0.75rem;">${patient.medications || 'None specified'}</td>
                <td style="font-size: 0.75rem;">${patient.tasks || 'No pending tasks'}</td>
            </tr>
        `).join('');
    }

    renderPatientCards() {
        const grid = document.getElementById('patientCardsGrid');
        
        if (this.patients.length === 0) {
            grid.innerHTML = '<div class="empty-cards-message"><p>No patients to display. Add a new patient to get started.</p></div>';
            return;
        }
        
        grid.innerHTML = this.patients.map(patient => `
            <div class="patient-card" data-patient-id="${patient.id}">
                <div class="patient-card-header" onclick="patientManager.handlePatientCardClick('${patient.id}')">
                    <h3>${patient.name}</h3>
                    <div class="patient-mrn">MRN: ${patient.mrn}</div>
                    
                    <div class="patient-info">
                        <div>
                            <label>Age/Sex:</label>
                            <span>${patient.age}/${patient.sex}</span>
                        </div>
                        <div>
                            <label>Bed:</label>
                            <span>${patient.bed}</span>
                        </div>
                        <div class="diagnosis">
                            <label>Diagnosis:</label>
                            <span>${patient.diagnosis} <small style="color: #64748b;">(DOA: ${patient.doa})</small></span>
                        </div>
                    </div>
                    
                    <div class="patient-status-row">
                        <span class="status-badge status-${patient.status.toLowerCase()}">${patient.status}</span>
                        <i data-lucide="chevron-down" class="expand-icon"></i>
                    </div>
                </div>
                
                <div class="patient-card-content">
                    <div class="patient-card-content-inner">
                        <div class="form-group">
                            <label>Medications (Abx/Other)</label>
                            <textarea class="medications-textarea" rows="2" placeholder="Enter medications...">${patient.medications || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Tasks</label>
                            <textarea class="tasks-textarea" rows="2" placeholder="Enter tasks...">${patient.tasks || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Additional Notes</label>
                            <textarea class="notes-textarea" rows="3" placeholder="Add any additional notes here...">${patient.notes || ''}</textarea>
                        </div>
                        
                        <div class="card-actions">
                            <button class="save-btn" onclick="patientManager.handleSavePatient('${patient.id}')">
                                <i data-lucide="save"></i>
                                Save Changes
                            </button>
                            <button class="delete-patient-btn" onclick="patientManager.showDeleteModal('${patient.id}')">
                                <i data-lucide="trash-2"></i>
                                Delete Patient
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderArchivedPatients() {
        const container = document.getElementById('archivedPatientsList');
        
        if (this.archivedPatients.length === 0) {
            container.innerHTML = `
                <div class="empty-archive-message">
                    <i data-lucide="archive" class="empty-icon"></i>
                    <p>No archived patients</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.archivedPatients.map(patient => {
            const deletedTime = this.formatDeletedTime(patient.deletedAt);
            return `
                <div class="archived-patient">
                    <div class="archived-patient-info">
                        <h4>${patient.name} <span class="archive-badge">Deleted ${deletedTime}</span></h4>
                        <div class="archived-patient-details">
                            MRN: ${patient.mrn} • ${patient.age}/${patient.sex} • ${patient.bed} • ${patient.diagnosis}
                        </div>
                    </div>
                    <div class="archive-actions">
                        <button class="restore-btn" onclick="patientManager.restorePatient('${patient.id}')">
                            <i data-lucide="undo"></i>
                            Restore
                        </button>
                        <button class="permanent-delete-btn" onclick="patientManager.permanentlyDeletePatient('${patient.id}')">
                            <i data-lucide="trash-2"></i>
                            Delete Forever
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatDeletedTime(deletedAt) {
        if (!deletedAt) return 'Unknown';
        
        const now = new Date();
        const deleted = new Date(deletedAt);
        const diffTime = Math.abs(now.getTime() - deleted.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'today';
        } else if (diffDays === 1) {
            return '1 day ago';
        } else {
            return `${diffDays} days ago`;
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.patientManager = new PatientManager();
});