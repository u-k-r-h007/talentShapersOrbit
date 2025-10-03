
import { useState } from 'react';
import type { Student, Trainer, Course, FeePayment, Expense, Assignment } from '../types';

const initialCourses: Course[] = [
  { id: 'c1', name: 'Fundamentals of Spoken English', category: 'Spoken English', level: 'Basic', duration: '3 Months', totalFee: 1000 },
  { id: 'c2', name: 'Advanced Conversational English', category: 'Spoken English', level: 'Advanced', duration: '4 Months', totalFee: 1500 },
  { id: 'c3', name: 'Introduction to Computing', category: 'Computer', level: 'Basic', duration: '2 Months', totalFee: 800 },
  { id: 'c4', name: 'Web Development Bootcamp', category: 'Computer', level: 'Advanced', duration: '6 Months', totalFee: 3000 },
];

const initialTrainers: Trainer[] = [
  { id: 't1', name: 'John Doe', email: 'john.doe@example.com', expertise: ['c1', 'c2'], phone: '555-0101', address: '123 Grammar Lane', imageUrl: `https://i.pravatar.cc/150?u=t1`, gender: 'Male' },
  { id: 't2', name: 'Jane Smith', email: 'jane.smith@example.com', expertise: ['c3', 'c4'], phone: '555-0102', address: '456 Code Street', imageUrl: `https://i.pravatar.cc/150?u=t2`, gender: 'Female' },
];

const initialStudents: Student[] = [
  { id: 's1', name: 'Alice Johnson', email: 'alice@example.com', phone: '123-456-7890', courseIds: ['c1'], joinDate: '2023-01-15', imageUrl: `https://i.pravatar.cc/150?u=s1`, address: '789 English Ave', gender: 'Female', status: 'Active' },
  { id: 's2', name: 'Bob Williams', email: 'bob@example.com', phone: '234-567-8901', courseIds: ['c3', 'c4'], joinDate: '2023-02-20', imageUrl: `https://i.pravatar.cc/150?u=s2`, address: '101 Binary Blvd', gender: 'Male', status: 'Active' },
  { id: 's3', name: 'Charlie Brown', email: 'charlie@example.com', phone: '345-678-9012', courseIds: ['c4'], joinDate: '2023-03-10', imageUrl: `https://i.pravatar.cc/150?u=s3`, address: '202 Dev Drive', gender: 'Male', status: 'Discontinued' },
];

const initialFeePayments: FeePayment[] = [
  { id: 'f1', studentId: 's1', amount: 500, date: '2023-01-15', status: 'Paid', paymentMethod: 'Card' },
  { id: 'f2', studentId: 's2', amount: 300, date: '2023-02-20', status: 'Paid', paymentMethod: 'Online' },
  { id: 'f3', studentId: 's3', amount: 1500, date: '2023-03-10', status: 'Pending', paymentMethod: 'Cash' },
  { id: 'f4', studentId: 's1', amount: 500, date: '2023-02-15', status: 'Paid', paymentMethod: 'Card' },
];

const initialExpenses: Expense[] = [
  { id: 'e1', description: 'January Rent', category: 'Rent', amount: 1000, date: '2023-01-05', comments: 'Monthly office rent' },
  { id: 'e2', description: 'Trainer Salaries', category: 'Salary', amount: 2500, date: '2023-01-28' },
  { id: 'e3', description: 'Internet Bill', category: 'Utilities', amount: 100, date: '2023-02-15', comments: 'High-speed fiber' },
];

const initialAssignments: Assignment[] = [
    { id: 'a1', title: 'Introductory Speech', courseId: 'c1', studentId: 's1', trainerId: 't1', dueDate: '2023-02-01', status: 'Submitted' },
    { id: 'a2', title: 'Basic HTML Page', courseId: 'c3', studentId: 's2', trainerId: 't2', dueDate: '2023-03-01', status: 'Pending' },
    { id: 'a3', title: 'Final Presentation', courseId: 'c1', studentId: 's1', trainerId: 't1', dueDate: '2023-03-15', status: 'Pending' },
];


export const useMockData = () => {
    const [courses, setCourses] = useState<Course[]>(initialCourses);
    const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
    const [students, setStudents] = useState<Student[]>(initialStudents);
    const [feePayments, setFeePayments] = useState<FeePayment[]>(initialFeePayments);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
    
    const createId = (prefix: string) => `${prefix}${Date.now()}`;
    const getCurrentDate = () => new Date().toISOString().split('T')[0];

    const addStudent = (data: Omit<Student, 'id' | 'joinDate'>) => {
        const newStudent: Student = { ...data, id: createId('s'), joinDate: getCurrentDate() };
        setStudents(prev => [...prev, newStudent]);
    };
    const updateStudent = (updatedStudent: Student) => {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    };
    const deleteStudent = (studentId: string) => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
    };

    const addTrainer = (data: Omit<Trainer, 'id'>) => {
        const newTrainer: Trainer = { ...data, id: createId('t') };
        setTrainers(prev => [...prev, newTrainer]);
    };
     const updateTrainer = (updatedTrainer: Trainer) => {
        setTrainers(prev => prev.map(t => t.id === updatedTrainer.id ? updatedTrainer : t));
    };
    const deleteTrainer = (trainerId: string) => {
        setTrainers(prev => prev.filter(t => t.id !== trainerId));
    };
    
    const addCourse = (data: Omit<Course, 'id'>) => {
        const newCourse: Course = { ...data, id: createId('c') };
        setCourses(prev => [...prev, newCourse]);
    };
     const updateCourse = (updatedCourse: Course) => {
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    };
    const deleteCourse = (courseId: string) => {
        setCourses(prev => prev.filter(c => c.id !== courseId));
    };
    
    const addFeePayment = (data: Omit<FeePayment, 'id'>) => {
        const newPayment: FeePayment = { ...data, id: createId('f'), date: data.date || getCurrentDate() };
        setFeePayments(prev => [...prev, newPayment]);
    };
     const updateFeePayment = (updatedPayment: FeePayment) => {
        setFeePayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    };
    const deleteFeePayment = (paymentId: string) => {
        setFeePayments(prev => prev.filter(p => p.id !== paymentId));
    };

    const addExpense = (data: Omit<Expense, 'id'>) => {
        const newExpense: Expense = { ...data, id: createId('e'), date: data.date || getCurrentDate() };
        setExpenses(prev => [...prev, newExpense]);
    };
    const updateExpense = (updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    };
    const deleteExpense = (expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    };

    const addAssignment = (data: Omit<Assignment, 'id' | 'status'>) => {
        const newAssignment: Assignment = { ...data, id: createId('a'), status: 'Pending', dueDate: data.dueDate || getCurrentDate() };
        setAssignments(prev => [...prev, newAssignment]);
    };
    const updateAssignment = (updatedAssignment: Assignment) => {
        setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
    };
    const deleteAssignment = (assignmentId: string) => {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    };

    return {
        courses,
        trainers,
        students,
        feePayments,
        expenses,
        assignments,
        addStudent,
        updateStudent,
        deleteStudent,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        addCourse,
        updateCourse,
        deleteCourse,
        addFeePayment,
        updateFeePayment,
        deleteFeePayment,
        addExpense,
        updateExpense,
        deleteExpense,
        addAssignment,
        updateAssignment,
        deleteAssignment,
    };
};
