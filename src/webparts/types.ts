
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  courseIds: string[];
  joinDate: string;
  imageUrl?: string;
  address?: string;
  gender: 'Male' | 'Female' | 'Other';
  status: 'Active' | 'Discontinued';
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  expertise: string[]; // Array of course IDs
  imageUrl?: string;
  phone?: string;
  address?: string;
  gender: 'Male' | 'Female' | 'Other';
}

export interface Course {
  id: string;
  name: string;
  category: 'Spoken English' | 'Computer';
  level: 'Basic' | 'Advanced';
  duration: string; // e.g., "3 Months"
  totalFee: number;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Other';
}

export interface Expense {
  id: string;
  description: string;
  category: 'Salary' | 'Utilities' | 'Marketing' | 'Rent' | 'Other';
  amount: number;
  date: string;
  billUrl?: string;
  comments?: string;
}

export interface Assignment {
  id:string;
  title: string;
  courseId: string;
  studentId: string;
  trainerId: string;
  dueDate: string;
  status: 'Pending' | 'Submitted';
  assignmentFileUrl?: string;
}
