import { useEffect, useState } from "react";
import type { Student, Course } from "../types";
import { web } from "../PnpUrl";
import { Web } from "sp-pnp-js";

export const useMockData = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [expenses, setExpenseData] = useState<any[]>([]);

  // expenses

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

  // assignment

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

  /// gajendra

  const sanitizeUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("https//")) return url.replace("https//", "https://");
    return `${window.location.origin}${url}`;
  };

  const dataUrlToBlob = (dataUrl: string): Blob => {
    // data:[<mediatype>][;base64],<data>
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
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

  const fetchAPIData = async (): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");
      const res = await web.lists
        .getById("023e9425-6982-4e89-87d9-b1dd8534bf96")
        .items.getAll();
      const mappedCourses: Course[] = res.map((item) => ({
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

  const fetchAPIStudent = async (): Promise<Student[]> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      const res = await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.select(
          "Id",
          "Title",
          "emailAddress",
          "phoneNumber",
          "gender",
          "address",
          "status",
          "profilePicture",
          "joinDate",
          "courses/Id",
          "courses/Title"
        )
        .expand("courses")
        .getAll();

      const mappedStudents: Student[] = res.map((item) => {
        // Prefer profilePicture.Url if available (Picture/Hyperlink field), otherwise try fileName fallback
        let imageUrl = "";
        if (item.profilePicture && item.profilePicture.Url) {
          imageUrl = sanitizeUrl(item.profilePicture.Url);
        } else if (item.profilePicture && item.profilePicture.fileName) {
          // Fallback to the thumbnails path if your library creates thumbnails this way
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
          joinDate: item.joinDate
            ? new Date(item.joinDate).toISOString().split("T")[0]
            : "",
          imageUrl, // Use constructed/sanitized URL
          courseIds: item.courses
            ? item.courses.map((c: { Id: number }) => String(c.Id))
            : [],
          courseNames: item.courses
            ? item.courses.map((c: { Title: string }) => c.Title)
            : [],
        };
      });

      setStudents(mappedStudents);
      return mappedStudents;
    } catch (error) {
      console.error("fetchStudents error ::", error);
      return [];
    }
  };

  // Upload helper for student images
  const uploadStudentImage = async (file: File) => {
    const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");
    const folder = web.getFolderByServerRelativeUrl(
      "/sites/TSO/Pictures/StudentImage"
    );
    const uploadedFile = await folder.files.add(file.name, file, true);
    return uploadedFile.data.ServerRelativeUrl; // ServerRelativeUrl
  };

  useEffect(() => {
    fetchAPIData().catch(console.error);
    fetchAPIStudent().catch(console.error);
  }, []);

  const addStudent = async (
    data: Omit<Student, "id">
  ): Promise<{ success: boolean; data?: unknown; error?: unknown }> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      // Prepare profilePicture field — handle File or base64 data URL or already relative URL
      let profileField: any = null;

      if ((data as any).imageFile) {
        // If caller provided a File object (recommended)
        const serverRel = await uploadStudentImage(
          (data as any).imageFile as File
        );
        profileField = { Url: serverRel, Description: "Profile Picture" };
      } else if (data.imageUrl && data.imageUrl.startsWith("data:")) {
        // If caller provided base64/data URL string
        const blob = dataUrlToBlob(data.imageUrl);
        const fileName = `student_${Date.now()}.png`;
        const file = blobToFile(blob, fileName);
        const serverRel = await uploadStudentImage(file);
        profileField = { Url: serverRel, Description: "Profile Picture" };
      } else if (
        data.imageUrl &&
        (data.imageUrl.startsWith("/") ||
          data.imageUrl.startsWith(window.location.origin))
      ) {
        // If imageUrl is already a server relative OR full URL, convert to relative for SharePoint field
        const rel = data.imageUrl.startsWith(window.location.origin)
          ? data.imageUrl.replace(window.location.origin, "")
          : data.imageUrl;
        profileField = { Url: rel, Description: "Profile Picture" };
      }

      const studentData: any = {
        Title: data.name,
        emailAddress: data.email,
        phoneNumber: data.phone,
        gender: data.gender,
        address: data.address,
        status: data.status || "Active",
        joinDate: data.joinDate || new Date().toISOString().split("T")[0],
        coursesId: { results: data.courseIds?.map((id) => Number(id)) || [] },
      };

      if (profileField) {
        studentData.profilePicture = profileField; // Picture/Hyperlink field value
      }

      const result = await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.add(studentData);

      await fetchAPIStudent();

      return { success: true, data: result };
    } catch (error) {
      console.error("addStudent error ::", error);
      return { success: false, error: error };
    }
  };

  const updateStudent = async (
    updatedStudent: Student
  ): Promise<{ success: boolean; error?: unknown }> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      // Prepare profilePicture update logic
      let profileFieldUpdate: any = null;

      if ((updatedStudent as any).imageFile) {
        // If a new File object is provided
        const serverRel = await uploadStudentImage(
          (updatedStudent as any).imageFile as File
        );
        profileFieldUpdate = { Url: serverRel, Description: "Profile Picture" };
      } else if (
        updatedStudent.imageUrl &&
        updatedStudent.imageUrl.startsWith("data:")
      ) {
        // If imageUrl is base64 data, upload it
        const blob = dataUrlToBlob(updatedStudent.imageUrl);
        const fileName = `student_${Date.now()}.png`;
        const file = blobToFile(blob, fileName);
        const serverRel = await uploadStudentImage(file);
        profileFieldUpdate = { Url: serverRel, Description: "Profile Picture" };
      } else if (updatedStudent.imageUrl) {
        // If imageUrl is full URL or relative path, convert to relative path for SharePoint
        const rel = updatedStudent.imageUrl.startsWith(window.location.origin)
          ? updatedStudent.imageUrl.replace(window.location.origin, "")
          : updatedStudent.imageUrl;
        profileFieldUpdate = { Url: rel, Description: "Profile Picture" };
      }

      const updateData: any = {
        Title: updatedStudent.name,
        emailAddress: updatedStudent.email,
        phoneNumber: updatedStudent.phone,
        gender: updatedStudent.gender,
        address: updatedStudent.address,
        status: updatedStudent.status,
        joinDate: updatedStudent.joinDate,
        coursesId: {
          results: updatedStudent.courseIds?.map((id) => Number(id)) || [],
        },
      };

      if (profileFieldUpdate) {
        updateData.profilePicture = profileFieldUpdate;
      }

      await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.getById(Number(updatedStudent.id))
        .update(updateData);

      await fetchAPIStudent();

      return { success: true };
    } catch (error) {
      console.error("updateStudent error ::", error);
      return { success: false, error: error };
    }
  };

  const deleteStudent = async (
    studentId: string
  ): Promise<{ success: boolean; error?: unknown }> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.getById(Number(studentId))
        .delete();

      await fetchAPIStudent();

      return { success: true };
    } catch (error) {
      console.error("deleteStudent error ::", error);
      return { success: false, error: error };
    }
  };

  const addCourse = async (data: Omit<Course, "id">): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      const res = await web.lists
        .getById("023e9425-6982-4e89-87d9-b1dd8534bf96")
        .items.add({
          Title: data.name,
          category: data.category,
          level: data.level,
          duration: data.duration,
          totalFee: data.totalFee,
        });

      // State update karne ke liye new object banao
      const newCourse: Course = {
        id: String(res.data.Id),
        name: data.name,
        category: data.category,
        level: data.level,
        duration: data.duration,
        totalFee: data.totalFee,
      };

      setCourses((prev) => [...prev, newCourse]);
    } catch (error) {
      console.error("addCourse error ::", error);
    }
  };

  const updateCourse = async (updatedCourse: Course): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");
      const list = web.lists.getById("023e9425-6982-4e89-87d9-b1dd8534bf96");
      await list.items.getById(Number(updatedCourse.id)).update({
        Title: updatedCourse.name, // Title column update
        category: updatedCourse.category,
        level: updatedCourse.level,
        duration: updatedCourse.duration,
        totalFee: updatedCourse.totalFee,
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
      );
    } catch (error) {
      console.error("updateCourse error ::", error);
    }
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      await web.lists
        .getById("023e9425-6982-4e89-87d9-b1dd8534bf96")
        .items.getById(Number(courseId))
        .delete();

      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (error) {
      console.error("deleteCourse error ::", error);
    }
  };

  return {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    uploadImageToLibrary,
    getImageUrl,
    storeImageReference,
    formatImageForHyperlinkPicture,
    parseImageFromHyperlinkPicture,
    courses,
    trainers,
    students,
    feePayments,
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
    addAssignment,
    updateAssignment,
    deleteAssignment,
  };
};
