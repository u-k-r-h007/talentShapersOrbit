import { useEffect, useState } from "react";
import type { Student, Course } from "../types";
import { web } from "../PnpUrl";

const initialStudents: Student[] = [
  {
    id: "s1",
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "123-456-7890",
    courseIds: ["c1"],
    joinDate: "2023-01-15",
    imageUrl: `https://i.pravatar.cc/150?u=s1`,
    address: "789 English Ave",
    gender: "Female",
    status: "Active",
  },
  {
    id: "s2",
    name: "Bob Williams",
    email: "bob@example.com",
    phone: "234-567-8901",
    courseIds: ["c3", "c4"],
    joinDate: "2023-02-20",
    imageUrl: `https://i.pravatar.cc/150?u=s2`,
    address: "101 Binary Blvd",
    gender: "Male",
    status: "Active",
  },
  {
    id: "s3",
    name: "Charlie Brown",
    email: "charlie@example.com",
    phone: "345-678-9012",
    courseIds: ["c4"],
    joinDate: "2023-03-10",
    imageUrl: `https://i.pravatar.cc/150?u=s3`,
    address: "202 Dev Drive",
    gender: "Male",
    status: "Discontinued",
  },
];

const initialCourses: Course[] = [
  {
    id: "c1",
    name: "Fundamentals of Spoken English",
    category: "Spoken English",
    level: "Basic",
    duration: "3 Months",
    totalFee: 1000,
  },
  {
    id: "c2",
    name: "Advanced Conversational English",
    category: "Spoken English",
    level: "Advanced",
    duration: "4 Months",
    totalFee: 1500,
  },
  {
    id: "c3",
    name: "Introduction to Computing",
    category: "Computer",
    level: "Basic",
    duration: "2 Months",
    totalFee: 800,
  },
  {
    id: "c4",
    name: "Web Development Bootcamp",
    category: "Computer",
    level: "Advanced",
    duration: "6 Months",
    totalFee: 3000,
  },
];

export const useMockData = () => {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [expenses, setExpenseData] = useState<any[]>([]);

  // expenses module
  // Upload image to Reciept picture library
  const uploadImageToLibrary = async (file: File): Promise<string> => {
    try {
      // Ensure the Reciept picture library exists
      const pictureLibrary = await web.lists.ensure(
        "Reciept",
        "Picture Library"
      );

      // Upload file to the picture library
      const uploadResult = await pictureLibrary.list.rootFolder.files.add(
        file.name,
        file,
        true
      );

      // Return the server relative URL
      console.log("site url ", uploadResult.data.ServerRelativeUrl);
      return uploadResult.data.ServerRelativeUrl;
    } catch (error: any) {
      console.log("Error uploading image to library:", error);
      throw error;
    }
  };

  // Format image URL for Hyperlink and Picture column
  const formatImageForHyperlinkPicture = (
    imageUrl: string,
    description: string = "Receipt"
  ): object | string => {
    if (!imageUrl) return "";

    // For Hyperlink and Picture column, SharePoint expects an object with Description and Url
    return {
      Description: description,
      Url: imageUrl,
    };
  };

  // Parse image URL from Hyperlink and Picture column
  const parseImageFromHyperlinkPicture = (imageData: any): string | null => {
    if (!imageData) return null;

    // Handle different data types
    if (typeof imageData === "string") {
      try {
        const parsed = JSON.parse(imageData);
        return (
          parsed.Url || parsed.url || parsed.serverRelativeUrl || imageData
        );
      } catch (error) {
        // If it's not JSON, return as direct URL
        return imageData;
      }
    } else if (typeof imageData === "object") {
      // If it's already an object, extract the URL
      return (
        imageData.Url || imageData.url || imageData.serverRelativeUrl || null
      );
    }

    return null;
  };

  // Get image URL from Reciept list
  const getImageUrl = async (imageId: string): Promise<string | null> => {
    try {
      const imageItem = await web.lists
        .getByTitle("Reciept")
        .items.getById(parseInt(imageId))
        .get();
      return imageItem.ServerRelativeUrl || null;
    } catch (error: any) {
      console.log("Error getting image URL:", error);
      return null;
    }
  };

  // Store image reference in Reciept list (optional metadata)
  const storeImageReference = async (
    serverRelativeUrl: string,
    expenseId: string
  ): Promise<string | null> => {
    try {
      const imageItem = await web.lists.getByTitle("Reciept").items.add({
        Title: `Expense_${expenseId}_${Date.now()}`,
        ServerRelativeUrl: serverRelativeUrl,
        ExpenseId: expenseId,
      });
      return imageItem.data.Id.toString();
    } catch (error: any) {
      console.log("Error storing image reference (this is optional):", error);
      // Don't throw error, just return null as this is optional metadata
      return null;
    }
  };

  // Update Expense Data
  const updateExpense = async (item: any): Promise<any> => {
    try {
      let imageUrl = item.billUrl;
      let formattedImageData: any = null;

      // If a new file is uploaded, handle it
      if (item.file && item.file instanceof File) {
        try {
          // Upload new image
          const serverRelativeUrl = await uploadImageToLibrary(item.file);
          // Store reference in Reciept list (optional)
          await storeImageReference(serverRelativeUrl, item.Id);
          imageUrl = serverRelativeUrl;
          // Format for Hyperlink and Picture column
          formattedImageData = formatImageForHyperlinkPicture(
            serverRelativeUrl,
            item.description
          );
        } catch (uploadError) {
          console.log("Error uploading new image:", uploadError);
        }
      } else if (imageUrl) {
        // If there's an existing image URL, format it
        formattedImageData = formatImageForHyperlinkPicture(
          imageUrl,
          item.description
        );
      }

      const updateData: any = {
        Title: item.description || "New Expense",
        Description: item.description,
        Category: item.category,
        Amount: Number(item.amount),
        Date: new Date(item.date).toISOString(),
        Comments: item.comments,
      };

      // Only add Reciept field if we have image data
      if (formattedImageData) {
        updateData.Reciept = formattedImageData;
      }

      const updatedRes = await web.lists
        .getByTitle("TsharperExpenses")
        .items.getById(item.Id)
        .update(updateData);
      await fetchExpenses();

      setExpenseData((prev) =>
        prev.map((e) => (e.Id === item.Id ? { ...e, ...updatedRes.data } : e))
      );

      console.log("Expense updated successfully", updatedRes.data);
    } catch (error: any) {
      console.log("update expenses error :: ", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await web.lists.getByTitle("TsharperExpenses").items.get();

      // Map expenses and parse the Hyperlink and Picture format
      const expensesWithImages = res.map((expense: any) => {
        const imageUrl = parseImageFromHyperlinkPicture(expense.Reciept);
        return {
          ...expense,
          billUrl: imageUrl,
        };
      });

      setExpenseData(expensesWithImages);
    } catch (err: any) {
      console.log("fetch expenses error :: ", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Add Expense Data
  const addExpense = async (item: any): Promise<void> => {
    try {
      let imageUrl = item.billUrl;
      let formattedImageData: any = null;

      // If a file is uploaded, handle it
      if (item.file && item.file instanceof File) {
        try {
          // Upload image to picture library
          const serverRelativeUrl = await uploadImageToLibrary(item.file);
          imageUrl = serverRelativeUrl;
          // Format for Hyperlink and Picture column
          formattedImageData = formatImageForHyperlinkPicture(
            serverRelativeUrl,
            item.description
          );
        } catch (uploadError) {
          console.log("Error uploading image:", uploadError);
        }
      } else if (imageUrl) {
        // If there's an existing image URL, format it
        formattedImageData = formatImageForHyperlinkPicture(
          imageUrl,
          item.description
        );
      }

      const expenseData: any = {
        Title: item.description,
        Description: item.description,
        Category: item.category,
        Amount: Number(item.amount),
        Date: item.date,
        Comments: item.comments,
      };

      // Only add Reciept field if we have image data
      if (formattedImageData) {
        expenseData.Reciept = formattedImageData;
      }

      const res = await web.lists
        .getByTitle("TsharperExpenses")
        .items.add(expenseData);

      // Store image reference in Reciept list (optional metadata)
      if (imageUrl) {
        try {
          await storeImageReference(imageUrl, res.data.Id);
        } catch (updateError) {
          console.log("Error storing image reference (optional):", updateError);
        }
      }

      setExpenseData((prev) => [...prev, { ...res.data, billUrl: imageUrl }]);
      console.log("Expense added successfully", res.data);
    } catch (err: any) {
      console.log("add expenses error :: ", err);
    }
  };

  // Delete Expenses Data
  const deleteExpense = async (item: any): Promise<any> => {
    try {
      const deleteRes = await web.lists
        .getByTitle("TsharperExpenses")
        .items.getById(item.Id)
        .delete();
      setExpenseData((prev) => prev.filter((e) => e.Id !== item.Id));
      console.log("deleted item :: ", deleteRes);
    } catch (error: any) {
      console.log("delete expenses :: ", error);
    }
  };

  // assignment module
  const uploadFileToLibrary = async (file: File): Promise<string> => {
    const folder = web.getFolderByServerRelativeUrl(
      "Shared Documents/TsharpersAssignmentDocs"
    );
    const uploaded = await folder.files.add(file.name, file, true);
    return `${window.location.origin}${uploaded.data.ServerRelativeUrl}`;
  };

  // CREATE
  const addAssignment = async (assignment: any) => {
    try {
      let fileUrl = "";
      if (assignment.assignmentFile) {
        fileUrl = await uploadFileToLibrary(assignment.assignmentFile);
      }

      await web.lists.getByTitle("TsharpersAssignment").items.add({
        Title: assignment.title,
        CourseId: assignment.courseId ? parseInt(assignment.courseId) : null,
        StudentId: assignment.studentId ? parseInt(assignment.studentId) : null,
        TrainerId: assignment.trainerId ? parseInt(assignment.trainerId) : null,
        DueDate: assignment.dueDate,
        Status: assignment.status || "Pending",
        AssignmentFile: fileUrl
          ? {
              Description: assignment.assignmentFile?.name || "Assignment PDF",
              Url: fileUrl,
            }
          : null,
      });

      await getAssignments();
    } catch (err) {
      console.error("Error adding assignment:", err);
    }
  };

  // READ (get all)
  const getAssignments = async () => {
    try {
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
  useEffect(() => {
    getAssignments();
  }, []);

  // UPDATE
  const updateAssignment = async (assignment: any) => {
    try {
      let fileField = undefined;
      if (assignment.assignmentFile) {
        const fileUrl = await uploadFileToLibrary(assignment.assignmentFile);
        fileField = { Url: fileUrl, Description: "Assignment File" };
      } else if (assignment.assignmentFileUrl) {
        fileField = {
          Url: assignment.assignmentFileUrl.replace(window.location.origin, ""),
          Description: "Assignment File",
        };
      }
      await web.lists
        .getByTitle("TsharpersAssignment")
        .items.getById(parseInt(assignment.id))
        .update({
          Title: assignment.title,
          CourseId: assignment.courseId ? parseInt(assignment.courseId) : null,
          StudentId: assignment.studentId
            ? parseInt(assignment.studentId)
            : null,
          TrainerId: assignment.trainerId
            ? parseInt(assignment.trainerId)
            : null,
          DueDate: assignment.dueDate,
          AssignmentFile: fileField,
          Status: assignment.status || "Pending",
        });
      await getAssignments();
    } catch (err) {
      console.error("Error updating assignment:", err);
      throw err;
    }
  };

  // DELETE
  const deleteAssignment = async (id: string) => {
    try {
      await web.lists
        .getByTitle("TsharpersAssignment")
        .items.getById(parseInt(id))
        .delete();
      await getAssignments();
    } catch (err) {
      console.error("Error deleting assignment:", err);
      throw err;
    }
  };

  // payment module

  // Fetch fee payments with student lookup
  const fetchFeePayments = async () => {
    try {
      const items = await web.lists
        .getByTitle("TsharpersFeeCollection")
        .items.select(
          "Id,Title,Student/ID,Student/Title,Amount,Date,Status,PaymentMethod"
        )
        .expand("Student")
        .get();

      const mapped = items.map((item: any) => ({
        id: item.Id.toString(),
        studentId: item.Student.ID.toString() || "",
        amount: Number(item.Amount),
        date: item.Date ? item.Date.split("T")[0] : "",
        status: item.Status,
        paymentMethod: item.PaymentMethod,
        studentName: item.StudentId?.Title || "",
      }));
      setFeePayments(mapped);
    } catch (err) {
      console.error("Error fetching fee payments:", err);
    }
  };

  useEffect(() => {
    fetchFeePayments();
  }, []);

  // Add Fee Payment
  const addFeePayment = async (data: any) => {
    try {
      await web.lists.getByTitle("TsharpersFeeCollection").items.add({
        Title: "Fee Payment",
        StudentId: parseInt(data.studentId),
        Amount: data.amount,
        Date: data.date,
        Status: data.status,
        PaymentMethod: data.paymentMethod,
      });
      await fetchFeePayments();
    } catch (err) {
      console.error("Error adding fee payment:", err);
    }
  };

  // Update Fee Payment
  const updateFeePayment = async (updatedPayment: any) => {
    try {
      await web.lists
        .getByTitle("TsharpersFeeCollection")
        .items.getById(parseInt(updatedPayment.id))
        .update({
          StudentId: parseInt(updatedPayment.studentId),
          Amount: updatedPayment.amount,
          Date: updatedPayment.date,
          Status: updatedPayment.status,
          PaymentMethod: updatedPayment.paymentMethod,
        });

      await fetchFeePayments();
    } catch (err) {
      console.error("Error updating fee payment:", err);
    }
  };

  // Delete Fee Payment
  const deleteFeePayment = async (paymentId: string) => {
    try {
      await web.lists
        .getByTitle("TsharpersFeeCollection")
        .items.getById(parseInt(paymentId))
        .delete();
      setFeePayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (err) {
      console.error("Error deleting fee payment:", err);
    }
  };

  // trainer model
  useEffect(() => {
    const getTrainers = async (): Promise<void> => {
      try {
        const list = await web.lists
          .getByTitle("TsharperTrainer")
          .items.select(
            "Id,Title,FullName,Email,Phone,Gender,Profile,Address,Expertise/Id,Expertise/Title"
          )
          .expand("Expertise")
          .get();

        const sanitizeUrl = (url: string) => {
          if (!url) return "";
          if (url.startsWith("http://") || url.startsWith("https://"))
            return url;
          // Fix missing colon after https
          if (url.startsWith("https//"))
            return url.replace("https//", "https://");
          return `${window.location.origin}${url}`;
        };

        const formatted = list.map((item: any) => ({
          id: item.Id.toString(),
          name: item.FullName,
          email: item.Email,
          phone: item.Phone,
          address: item.Address,
          gender: item.Gender,
          imageUrl: sanitizeUrl(item.Profile?.Url),
          expertise: item.Expertise.map((ex: any) => ex.Id.toString()),
        }));

        setTrainers(formatted);
      } catch (err) {
        console.error("Error fetching trainers:", err);
      }
    };

    getTrainers();
  }, []);

  // TrainerMethods.ts
  const uploadTrainerImage = async (file: File) => {
    const folder = web.getFolderByServerRelativeUrl(
      "/sites/TSO/Pictures/TrainerImage"
    );
    const uploadedFile = await folder.files.add(file.name, file, true);
    return uploadedFile.data.ServerRelativeUrl; // ServerRelativeUrl
  };

  // 🔹 Add a new trainer
  const addTrainer = async (trainer: any) => {
    try {
      const profileField: any = trainer.imageFile
        ? {
            Url: await uploadTrainerImage(trainer.imageFile),
            Description: "Profile Picture",
          }
        : null;

      const item = await web.lists.getByTitle("TsharperTrainer").items.add({
        Title: trainer.name,
        FullName: trainer.name,
        Email: trainer.email,
        Phone: trainer.phone,
        Address: trainer.address,
        Gender: trainer.gender,
        Profile: profileField,
        ExpertiseId: {
          results: trainer.expertise.map((id: any) => parseInt(id)),
        },
      });

      const newTrainer: any = {
        ...trainer,
        id: item.data.Id.toString(),
        imageUrl: profileField?.Url
          ? `${window.location.origin}${profileField.Url}`
          : "",
      };
      setTrainers([...trainers, newTrainer]);
    } catch (err) {
      console.error("Error adding trainer:", err);
    }
  };

  // 🔹 Update trainer
  const updateTrainer = async (trainer: any): Promise<void> => {
    try {
      const profileFieldUpdate: any = trainer.imageFile
        ? {
            Url: await uploadTrainerImage(trainer.imageFile),
            Description: "Profile Picture",
          }
        : trainer.imageUrl
        ? {
            Url: trainer.imageUrl.replace(window.location.origin, ""),
            Description: "Profile Picture",
          }
        : null;

      await web.lists
        .getByTitle("TsharperTrainer")
        .items.getById(parseInt(trainer.id))
        .update({
          FullName: trainer.name,
          Email: trainer.email,
          Phone: trainer.phone,
          Address: trainer.address,
          Gender: trainer.gender,
          Profile: profileFieldUpdate,
          ExpertiseId: {
            results: trainer.expertise.map((id: any) => parseInt(id)),
          },
        });

      const updatedTrainer = {
        ...trainer,
        imageUrl: profileFieldUpdate?.Url
          ? `${window.location.origin}${profileFieldUpdate.Url}`
          : trainer.imageUrl || "",
      };

      setTrainers(
        trainers.map((t) => (t.id === trainer.id ? updatedTrainer : t))
      );
    } catch (err) {
      console.error("Error updating trainer:", err);
    }
  };

  // 🔹 Delete trainer
  const deleteTrainer = async (id: string): Promise<void> => {
    try {
      await web.lists
        .getByTitle("TsharperTrainer")
        .items.getById(parseInt(id))
        .delete();
      setTrainers(trainers.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting trainer:", err);
    }
  };

  const createId = (prefix: string) => `${prefix}${Date.now()}`;
  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const addCourse = (data: Omit<Course, "id">) => {
    const newCourse: Course = { ...data, id: createId("c") };
    setCourses((prev) => [...prev, newCourse]);
  };

  const updateCourse = (updatedCourse: Course) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
    );
  };

  const deleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };
  
  const addStudent = (data: Omit<Student, "id" | "joinDate">) => {
    const newStudent: Student = {
      ...data,
      id: createId("s"),
      joinDate: getCurrentDate(),
    };
    setStudents((prev) => [...prev, newStudent]);
  };
  const updateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };
  const deleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  return {
    courses,
    trainers,
    students,
    feePayments,
    assignments,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    uploadImageToLibrary,
    getImageUrl,
    storeImageReference,
    formatImageForHyperlinkPicture,
    parseImageFromHyperlinkPicture,
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
    addAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
