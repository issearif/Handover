// Local storage-based authentication and data management for GitHub Pages

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface Patient {
  id: string;
  name: string;
  mrn: string;
  age: number;
  sex: string;
  bed: string;
  diagnosis: string;
  doa: string;
  medications: string[];
  tasks: string[];
  notes: string[];
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Simple password hashing for client-side (not secure for production)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

export class LocalStorageAuth {
  private static USERS_KEY = 'med_handover_users';
  private static CURRENT_USER_KEY = 'med_handover_current_user';
  private static PATIENTS_KEY = 'med_handover_patients';

  // Initialize with admin user
  static init() {
    const users = this.getUsers();
    if (!users.find(u => u.username === 'admin')) {
      this.createUser({
        username: 'admin',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@hospital.com'
      });
    }
  }

  // User management
  static getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  static saveUsers(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  static createUser(userData: { username: string; password: string; firstName?: string; lastName?: string; email?: string }): User {
    const users = this.getUsers();
    
    if (users.find(u => u.username === userData.username)) {
      throw new Error('Username already exists');
    }

    const user: User = {
      id: crypto.randomUUID(),
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
    };

    // Store password hash separately (simple client-side approach)
    const passwords = JSON.parse(localStorage.getItem('med_handover_passwords') || '{}');
    passwords[userData.username] = simpleHash(userData.password);
    localStorage.setItem('med_handover_passwords', JSON.stringify(passwords));

    users.push(user);
    this.saveUsers(users);
    return user;
  }

  static login(username: string, password: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwords = JSON.parse(localStorage.getItem('med_handover_passwords') || '{}');
    if (passwords[username] !== simpleHash(password)) {
      throw new Error('Invalid credentials');
    }

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }

  static logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  static getCurrentUser(): User | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Patient management
  static getPatients(): Patient[] {
    const patients = localStorage.getItem(this.PATIENTS_KEY);
    return patients ? JSON.parse(patients) : [];
  }

  static savePatients(patients: Patient[]) {
    localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
  }

  static addPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>): Patient {
    const patients = this.getPatients();
    const patient: Patient = {
      ...patientData,
      id: crypto.randomUUID(),
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    patients.push(patient);
    this.savePatients(patients);
    return patient;
  }

  static updatePatient(id: string, updates: Partial<Patient>): Patient {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Patient not found');
    
    patients[index] = { ...patients[index], ...updates, updatedAt: new Date() };
    this.savePatients(patients);
    return patients[index];
  }

  static archivePatient(id: string): boolean {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === id);
    if (!patient) return false;
    
    patient.isArchived = true;
    patient.archivedAt = new Date();
    this.savePatients(patients);
    return true;
  }

  static restorePatient(id: string): boolean {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === id);
    if (!patient) return false;
    
    patient.isArchived = false;
    delete patient.archivedAt;
    this.savePatients(patients);
    return true;
  }

  static deletePatient(id: string): boolean {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    patients.splice(index, 1);
    this.savePatients(patients);
    return true;
  }
}