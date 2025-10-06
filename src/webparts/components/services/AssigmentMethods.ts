import { web } from "../../PnpUrl";
import { useEffect, useState } from "react";

export const AssigmentMethods = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const uploadFileToLibrary = async (file: File): Promise<string> => {
    const folder = web.getFolderByServerRelativeUrl("Shared Documents/TsharpersAssignmentDocs");
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
        AssignmentFile: fileUrl
          ? { Description: assignment.assignmentFile?.name || "Assignment PDF", Url: fileUrl }
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
      const items = await web.lists.getByTitle("TsharpersAssignment").items
        .select(
          "Id,Title,Course/Id,Course/Title,Student/Id,Student/Title,Trainer/Id,Trainer/Title,DueDate,AssignmentFile,Status"
        )
        .expand("Course,Student,Trainer")
        .get();
      const mappedData =  items.map((item: any) => ({
        id: item.Id.toString(),
        title: item.Title,
        courseId: item.Course?.Id?.toString() || "",
        courseName: item.Course?.Title || "",
        studentId: item.Student?.Id?.toString() || "",
        studentName: item.Student?.Title || "",
        trainerId: item.Trainer?.Id?.toString() || "",
        trainerName: item.Trainer?.Title || "",
        dueDate: (item.DueDate),
        status: item.Status || "Pending",
        assignmentFileUrl: item.AssignmentFile?.Url || "",
      }));

      const item1 = await web.lists.getByTitle('TshapersCourses').items
      .select('Id','Title')
      .get();

      const mappedCourses = item1.map((item:any)=>({
        id: item.Id.toString(),
        name: item.Title
      }))

      setCourses(mappedCourses);
      setAssignments(mappedData);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      throw err;
    }
  };
  useEffect(()=>{
    getAssignments();
  },[])

  // UPDATE
  const updateAssignment = async (assignment: any) => {
    try {
      let fileField = undefined;
      if (assignment.assignmentFile) {
        const fileUrl = await uploadFileToLibrary(assignment.assignmentFile);
        fileField = { Url: fileUrl, Description: "Assignment File" };
      } else if (assignment.assignmentFileUrl) {
        fileField = { Url: assignment.assignmentFileUrl.replace(window.location.origin, ""), Description: "Assignment File" };
      }
      await web.lists.getByTitle("TsharpersAssignment").items.getById(parseInt(assignment.id)).update({
        Title: assignment.title,
        CourseId: assignment.courseId ? parseInt(assignment.courseId) : null,
        StudentId: assignment.studentId ? parseInt(assignment.studentId) : null,
        TrainerId: assignment.trainerId ? parseInt(assignment.trainerId) : null,
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
      await web.lists.getByTitle("TsharpersAssignment").items.getById(parseInt(id)).delete();
      await getAssignments();
    } catch (err) {
      console.error("Error deleting assignment:", err);
      throw err;
    }
  };

  return ({
    courses,
    assignments,
    addAssignment,
    getAssignments,
    updateAssignment,
    deleteAssignment,
  });
};
