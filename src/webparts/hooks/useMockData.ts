import { useState, useEffect } from 'react';
import { Web } from "sp-pnp-js";

import type { Student, Trainer, Course, FeePayment, Expense, Assignment } from '../types';
const initialTrainers: Trainer[] = [
    { id: 't1', name: 'John Doe', email: 'john.doe@example.com', expertise: ['c1', 'c2'], phone: '555-0101', address: '123 Grammar Lane', imageUrl: `https://i.pravatar.cc/150?u=t1`, gender: 'Male' },
    { id: 't2', name: 'Jane Smith', email: 'jane.smith@example.com', expertise: ['c3', 'c4'], phone: '555-0102', address: '456 Code Street', imageUrl: `https://i.pravatar.cc/150?u=t2`, gender: 'Female' },
];

const initialExpenses: Expense[] = [
    { id: 'e1', description: 'January Rent', category: 'Rent', amount: 1000, date: '2023-01-05', comments: 'Monthly office rent' },
    { id: 'e2', description: 'Trainer Salaries', category: 'Salary', amount: 2500, date: '2023-01-28' },
    { id: 'e3', description: 'Internet Bill', category: 'Utilities', amount: 100, date: '2023-02-15', comments: 'High-speed fiber' },
];


const sanitizeUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('https//')) return url.replace('https//', 'https://');
    return `${window.location.origin}${url}`;
};

const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, { type: blob.type });
};

export const useMockData = (): {
    courses: Course[];
    trainers: Trainer[];
    students: Student[];
    feePayments: FeePayment[];
    expenses: Expense[];
    assignments: Assignment[];
    addStudent: (data: Omit<Student, 'id'>) => Promise<{ success: boolean; data?: unknown; error?: unknown }>;
    updateStudent: (updatedStudent: Student) => Promise<{ success: boolean; error?: unknown }>;
    deleteStudent: (studentId: string) => Promise<{ success: boolean; error?: unknown }>;
    addTrainer: (data: Omit<Trainer, 'id'>) => void;
    updateTrainer: (updatedTrainer: Trainer) => void;
    deleteTrainer: (trainerId: string) => void;
    addCourse: (data: Omit<Course, 'id'>) => Promise<void>;
    updateCourse: (updatedCourse: Course) => Promise<void>;
    deleteCourse: (courseId: string) => Promise<void>;
    addFeePayment: (data: Omit<FeePayment, 'id'>) => void;
    updateFeePayment: (updatedPayment: FeePayment) => void;
    deleteFeePayment: (paymentId: string) => void;
    addExpense: (data: Omit<Expense, 'id'>) => void;
    updateExpense: (updatedExpense: Expense) => void;
    deleteExpense: (expenseId: string) => void;
    addAssignment: (data: Omit<Assignment, 'id' | 'status'>) => void;
    updateAssignment: (updatedAssignment: Assignment) => void;
    deleteAssignment: (assignmentId: string) => void;
} => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
    const [students, setStudents] = useState<Student[]>([]);
    const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    const fetchCourses = async (): Promise<void> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');
            const res = await web.lists.getById('023e9425-6982-4e89-87d9-b1dd8534bf96').items.getAll();
            const mappedCourses: Course[] = res.map(item => ({
                id: String(item.Id),
                name: item.Title,
                category: item.category || "",
                level: item.level || "",
                duration: item.duration || "",
                totalFee: item.totalFee || 0,
            }));
            setCourses(mappedCourses);
        } catch (error) {
            console.error("fetchCourses error ::", error);
        }
    };

    const createId = (prefix: string): string => `${prefix}${Date.now()}`;
    const getCurrentDate = (): string => new Date().toISOString().split('T')[0];


    const fetchAPIStudent = async (): Promise<Student[]> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');

            const res = await web.lists
                .getById('25a7c502-9910-498e-898b-a0b37888a15e')
                .items
                .select(
                    'Id',
                    'Title',
                    'emailAddress',
                    'phoneNumber',
                    'gender',
                    'address',
                    'status',
                    'profilePicture',
                    'joinDate',
                    'courses/Id',
                    'courses/Title'
                )
                .expand('courses')
                .getAll();

            console.log("Raw SharePoint response:", res);

            const mappedStudents: Student[] = res.map(item => {
                let imageUrl = "";
                if (item.profilePicture && item.profilePicture.Url) {
                    imageUrl = sanitizeUrl(item.profilePicture.Url);
                } else if (item.profilePicture && item.profilePicture.fileName) {
                    imageUrl = `https://smalsusinfolabs.sharepoint.com/sites/TSO/Pictures/Forms/Thumbnails/StudentImage/${item.profilePicture.fileName}`;
                } else {
                    // Default placeholder
                    imageUrl = `https://i.pravatar.cc/150?u=student${item.Id}`;
                }

                return {
                    id: String(item.Id),
                    name: item.Title || "",
                    email: item.emailAddress || "",
                    phone: String(item.phoneNumber || ""),
                    gender: item.gender || "",
                    address: item.address || "",
                    status: item.status || "Active",
                    joinDate: item.joinDate ? new Date(item.joinDate).toISOString().split("T")[0] : "",
                    imageUrl,  // Use constructed/sanitized URL
                    courseIds: item.courses ? item.courses.map((c: { Id: number }) => String(c.Id)) : [],
                    courseNames: item.courses ? item.courses.map((c: { Title: string }) => c.Title) : []
                };
            });

            console.log("Mapped students with images:", mappedStudents);

            setStudents(mappedStudents);
            console.log("Students fetched successfully:", mappedStudents.length, "students");

            return mappedStudents;

        } catch (error) {
            console.error("fetchStudents error ::", error);
            return [];
        }
    };

    // Upload helper for student images
    const uploadStudentImage = async (file: File) => {
        const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');
        const folder = web.getFolderByServerRelativeUrl("/sites/TSO/Pictures/StudentImage");
        const uploadedFile = await folder.files.add(file.name, file, true);
        return uploadedFile.data.ServerRelativeUrl; // ServerRelativeUrl
    };

    useEffect(() => {
        fetchCourses().catch(console.error);
        fetchAPIStudent().catch(console.error);
        fetchFeePayments();
        getAssignments();
    }, []);


    const addStudent = async (data: Omit<Student, 'id'>): Promise<{ success: boolean; data?: unknown; error?: unknown }> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');

            // Prepare profilePicture field — handle File or base64 data URL or already relative URL
            let profileField: any = null;

            if ((data as any).imageFile) {
                // If caller provided a File object (recommended)
                const serverRel = await uploadStudentImage((data as any).imageFile as File);
                profileField = { Url: serverRel, Description: 'Profile Picture' };
            } else if (data.imageUrl && data.imageUrl.startsWith('data:')) {
                // If caller provided base64/data URL string
                const blob = dataUrlToBlob(data.imageUrl);
                const fileName = `student_${Date.now()}.png`;
                const file = blobToFile(blob, fileName);
                const serverRel = await uploadStudentImage(file);
                profileField = { Url: serverRel, Description: 'Profile Picture' };
            } else if (data.imageUrl && (data.imageUrl.startsWith('/') || data.imageUrl.startsWith(window.location.origin))) {
                // If imageUrl is already a server relative OR full URL, convert to relative for SharePoint field
                const rel = data.imageUrl.startsWith(window.location.origin) ? data.imageUrl.replace(window.location.origin, '') : data.imageUrl;
                profileField = { Url: rel, Description: 'Profile Picture' };
            }

            // Log the data being sent to SharePoint
            console.log("Adding student with data:", {
                ...data,
                imageUrl: data.imageUrl ? `(${data.imageUrl.length} chars)` : 'No image'
            });

            const studentData: any = {
                Title: data.name,
                emailAddress: data.email,
                phoneNumber: data.phone,
                gender: data.gender,
                address: data.address,
                status: data.status || "Active",
                joinDate: data.joinDate || new Date().toISOString().split("T")[0],
                coursesId: { results: data.courseIds?.map(id => Number(id)) || [] },
            };

            if (profileField) {
                studentData.profilePicture = profileField; // Picture/Hyperlink field value
            }

            const result = await web.lists
                .getById('25a7c502-9910-498e-898b-a0b37888a15e')
                .items.add(studentData);

            console.log("Student added successfully!", result);

            await fetchAPIStudent();

            return { success: true, data: result };
        } catch (error) {
            console.error("addStudent error ::", error);
            return { success: false, error: error };
        }
    };

    const updateStudent = async (updatedStudent: Student): Promise<{ success: boolean; error?: unknown }> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');

            // Prepare profilePicture update logic
            let profileFieldUpdate: any = null;

            if ((updatedStudent as any).imageFile) {
                const serverRel = await uploadStudentImage((updatedStudent as any).imageFile as File);
                profileFieldUpdate = { Url: serverRel, Description: 'Profile Picture' };
            } else if (updatedStudent.imageUrl && updatedStudent.imageUrl.startsWith('data:')) {
                // If imageUrl is base64 data, upload it
                const blob = dataUrlToBlob(updatedStudent.imageUrl);
                const fileName = `student_${Date.now()}.png`;
                const file = blobToFile(blob, fileName);
                const serverRel = await uploadStudentImage(file);
                profileFieldUpdate = { Url: serverRel, Description: 'Profile Picture' };
            } else if (updatedStudent.imageUrl) {
                // If imageUrl is full URL or relative path, convert to relative path for SharePoint
                const rel = updatedStudent.imageUrl.startsWith(window.location.origin) ? updatedStudent.imageUrl.replace(window.location.origin, '') : updatedStudent.imageUrl;
                profileFieldUpdate = { Url: rel, Description: 'Profile Picture' };
            }

            // Log the data being sent to SharePoint
            console.log("Updating student with data:", {
                ...updatedStudent,
                imageUrl: updatedStudent.imageUrl ? `(${updatedStudent.imageUrl.length} chars)` : 'No image'
            });

            const updateData: any = {
                Title: updatedStudent.name,
                emailAddress: updatedStudent.email,
                phoneNumber: updatedStudent.phone,
                gender: updatedStudent.gender,
                address: updatedStudent.address,
                status: updatedStudent.status,
                joinDate: updatedStudent.joinDate,
                coursesId: { results: updatedStudent.courseIds?.map(id => Number(id)) || [] }
            };

            if (profileFieldUpdate) {
                updateData.profilePicture = profileFieldUpdate;
            }

            await web.lists
                .getById('25a7c502-9910-498e-898b-a0b37888a15e')
                .items.getById(Number(updatedStudent.id))
                .update(updateData);

            console.log("Student updated successfully!");

            await fetchAPIStudent();

            return { success: true };
        } catch (error) {
            console.error("updateStudent error ::", error);
            return { success: false, error: error };
        }
    };

    const deleteStudent = async (studentId: string): Promise<{ success: boolean; error?: unknown }> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');

            await web.lists
                .getById('25a7c502-9910-498e-898b-a0b37888a15e')
                .items.getById(Number(studentId))
                .delete();

            console.log("Student deleted successfully!");

            await fetchAPIStudent();

            return { success: true };
        } catch (error) {
            console.error("deleteStudent error ::", error);
            return { success: false, error: error };
        }
    };

    const addTrainer = (data: Omit<Trainer, 'id'>): void => {
        const newTrainer: Trainer = { ...data, id: createId('t') };
        setTrainers(prev => [...prev, newTrainer]);
    };
    const updateTrainer = (updatedTrainer: Trainer): void => {
        setTrainers(prev => prev.map(t => t.id === updatedTrainer.id ? updatedTrainer : t));
    };
    const deleteTrainer = (trainerId: string): void => {
        setTrainers(prev => prev.filter(t => t.id !== trainerId));
    };



    const addCourse = async (data: Omit<Course, 'id'>): Promise<void> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');

            const res = await web.lists
                .getById('023e9425-6982-4e89-87d9-b1dd8534bf96')
                .items.add({
                    Title: data.name,
                    category: data.category,
                    level: data.level,
                    duration: data.duration,
                    totalFee: data.totalFee,
                });

            console.log("Course added ::", res);

            // State update karne ke liye new object banao
            const newCourse: Course = {
                id: String(res.data.Id),
                name: data.name,
                category: data.category,
                level: data.level,
                duration: data.duration,
                totalFee: data.totalFee,
            };

            setCourses(prev => [...prev, newCourse]);
        } catch (error) {
            console.error("addCourse error ::", error);
        }
    };

    const updateCourse = async (updatedCourse: Course): Promise<void> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');
            const list = web.lists.getById('023e9425-6982-4e89-87d9-b1dd8534bf96');
            await list.items.getById(Number(updatedCourse.id)).update({
                Title: updatedCourse.name,   // Title column update
                category: updatedCourse.category,
                level: updatedCourse.level,
                duration: updatedCourse.duration,
                totalFee: updatedCourse.totalFee,
            });
            console.log("Course updated successfully:", updatedCourse);

            setCourses(prev =>
                prev.map(c => (c.id === updatedCourse.id ? updatedCourse : c))
            );
        } catch (error) {
            console.error("updateCourse error ::", error);
        }
    };

    const deleteCourse = async (courseId: string): Promise<void> => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');

            await web.lists
                .getById('023e9425-6982-4e89-87d9-b1dd8534bf96')
                .items.getById(Number(courseId))
                .delete();

            console.log("Course deleted ::", courseId);

            setCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (error) {
            console.error("deleteCourse error ::", error);
        }
    };



    const fetchFeePayments = async () => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');
            const items = await web.lists
                .getById("29c80eac-d776-4043-819a-dab43a982585")
                .items
                .select("Id,Title,Student/Id,Student/Title,Amount,Date,Status,PaymentMethod")
                .expand("Student")
                .getAll();

            const mapped = items.map((item: any) => ({
                id: item.Id?.toString() || "",
                studentId: item.Student?.Id?.toString() || "",
                studentName: item.Student?.Title || "",
                amount: Number(item.Amount) || 0,
                date: item.Date ? item.Date.split("T")[0] : "",
                status: item.Status || "",
                paymentMethod: item.PaymentMethod || "",
            }));

            setFeePayments(mapped);
            console.log(" Fee Payments fetched:", mapped);

        } catch (err) {
            console.error(" Error fetching fee payments:", err);
        }
    };
    const addFeePayment = (data: Omit<FeePayment, 'id'>): void => {
        const newPayment: FeePayment = { ...data, id: createId('f'), date: data.date || getCurrentDate() };
        setFeePayments(prev => [...prev, newPayment]);
    };
    const updateFeePayment = (updatedPayment: FeePayment): void => {
        setFeePayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
    };
    const deleteFeePayment = (paymentId: string): void => {
        setFeePayments(prev => prev.filter(p => p.id !== paymentId));
    };

    const addExpense = (data: Omit<Expense, 'id'>): void => {
        const newExpense: Expense = { ...data, id: createId('e'), date: data.date || getCurrentDate() };
        setExpenses(prev => [...prev, newExpense]);
    };
    const updateExpense = (updatedExpense: Expense): void => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    };
    const deleteExpense = (expenseId: string): void => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    };



    const getAssignments = async () => {
        try {
            const web = new Web('https://smalsusinfolabs.sharepoint.com/sites/TSO');
            const items = await web.lists
                .getByTitle("TsharpersAssignment")
                .items.select(
                    "Id,Title,Course/Id,Course/Title,Student/Id,Student/Title,Trainer/Id,Trainer/Title,DueDate,AssignmentFile,Status"
                )
                .expand("Course,Student,Trainer")
                .get();

            const mappedData = items.map((item: any) => ({
                id: item.Id.toString(),
                title: item.Title,
                courseId: item.Course?.Id?.toString() || "",
                courseName: item.Course?.Title || "",
                studentId: item.Student?.Id?.toString() || "",
                studentName: item.Student?.Title || "",
                trainerId: item.Trainer?.Id?.toString() || "",
                trainerName: item.Trainer?.Title || "",
                dueDate: item.DueDate,
                status: item.Status || "Pending",
                assignmentFileUrl: item.AssignmentFile?.Url || "",
            }));


            setAssignments(mappedData);

        } catch (err) {
            console.error("Error fetching assignments:", err);
            throw err;
        }
    };

    const addAssignment = (data: Omit<Assignment, 'id' | 'status'>): void => {
        const newAssignment: Assignment = { ...data, id: createId('a'), status: 'Pending', dueDate: data.dueDate || getCurrentDate() };
        setAssignments(prev => [...prev, newAssignment]);
    };
    const updateAssignment = (updatedAssignment: Assignment): void => {
        setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
    };
    const deleteAssignment = (assignmentId: string): void => {
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
