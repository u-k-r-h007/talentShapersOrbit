import * as React from "react";
import { useState, useMemo } from "react";
import Table from "../common/Table";
import Modal from "../common/Modal";
import ConfirmationModal from "../common/ConfirmationModal";
import { useMockData } from "../../hooks/useMockData";
import type { Assignment } from "../../types";
import { web } from "../../PnpUrl";

// Icons
const EditIcon: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    width="16"
    height="16"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"
    />
  </svg>
);
const DeleteIcon: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    width="16"
    height="16"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const DocumentIcon: React.FC<{ className?: string }> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    width="20"
    height="20"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// Reusable Form Components
const FormInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
> = ({ label, ...props }) => (
  <div className="mb-3">
    <label className="form-label">{label}</label>
    <input {...props} className="form-control" />
  </div>
);
const FormSelect: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }
> = ({ label, children, ...props }) => (
  <div className="mb-3">
    <label className="form-label">{label}</label>
    <select {...props} className="form-select">
      {children}
    </select>
  </div>
);

const AssignmentsView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({
  data,
}) => {
  const { courses, trainers, students, assignments, getAssignments } = data;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null
  );
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<Assignment | null>(null);

  const initialFormState: any = {
    title: "",
    courseId: "",
    studentId: "",
    trainerId: "",
    dueDate: new Date().toISOString().split("T")[0],
    assignmentFile: undefined,
  };

  const [formState, setFormState] = useState(initialFormState);

  // 🔹 Helper functions
  const getStudentName = (studentId: string) =>
    students.find((s) => s.id === studentId)?.name || "N/A";
  const getCourseName = (courseId: string) =>
    courses.find((c: any) => c.id === courseId)?.name || "N/A";

  // 🔹 File upload (default SharePoint attachment)
  const uploadAttachment = async (itemId: number, file: File) => {
    const buffer = await file.arrayBuffer();

    // Delete previous attachments first
    const attachments = await web.lists
      .getById("1d5452dc-7b1d-430b-b316-0680492ffd48")
      .items.getById(itemId)
      .attachmentFiles.get();
    for (const f of attachments) {
      await web.lists
        .getById("1d5452dc-7b1d-430b-b316-0680492ffd48")
        .items.getById(itemId)
        .attachmentFiles.getByName(f.FileName)
        .delete();
    }

    const uploaded = await web.lists
      .getById("1d5452dc-7b1d-430b-b316-0680492ffd48")
      .items.getById(itemId)
      .attachmentFiles.add(file.name, buffer);
    return `${window.location.origin}${uploaded.data.ServerRelativeUrl}`;
  };

  // 🔹 Open modal
  const handleOpenModal = (assignment: Assignment | null = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormState({
        title: assignment.title || "",
        courseId: assignment.courseId || "",
        studentId: assignment.studentId || "",
        trainerId: assignment.trainerId || "",
        dueDate:
          assignment.dueDate.substring(0, 10) ||
          new Date().toISOString().split("T")[0],
        assignmentFile: undefined,
      });
    } else {
      setEditingAssignment(null);
      setFormState(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAssignment(null);
    setFormState(initialFormState);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFormState((prev: any) => ({ ...prev, assignmentFile: file }));
  };

  // 🔹 Submit
  const handleSubmit = async () => {
    if (
      !formState.title ||
      !formState.courseId ||
      !formState.studentId ||
      !formState.trainerId
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const list = web.lists.getById("1d5452dc-7b1d-430b-b316-0680492ffd48");

      if (editingAssignment) {
        // UPDATE
        await list.items.getById(parseInt(editingAssignment.id)).update({
          Title: formState.title,
          CourseId: parseInt(formState.courseId),
          StudentId: parseInt(formState.studentId),
          TrainerId: parseInt(formState.trainerId),
          DueDate: formState.dueDate,
        });

        if (formState.assignmentFile) {
          await uploadAttachment(
            parseInt(editingAssignment.id),
            formState.assignmentFile
          );
        }
      } else {
        // CREATE
        const addRes = await list.items.add({
          Title: formState.title,
          CourseId: parseInt(formState.courseId),
          StudentId: parseInt(formState.studentId),
          TrainerId: parseInt(formState.trainerId),
          DueDate: formState.dueDate,
        });

        if (formState.assignmentFile) {
          await uploadAttachment(addRes.data.Id, formState.assignmentFile);
        }
      }

      await getAssignments();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving assignment:", err);
    }
  };

  // 🔹 Delete
  const handleDelete = async () => {
    if (!assignmentToDelete) return;
    try {
      await web.lists
        .getById("1d5452dc-7b1d-430b-b316-0680492ffd48")
        .items.getById(parseInt(assignmentToDelete.id))
        .delete();
      await getAssignments();
      setAssignmentToDelete(null);
    } catch (err) {
      console.error("Error deleting assignment:", err);
    }
  };

  const studentsForCourse = useMemo(
    () => students.filter((s) => s.courseIds.includes(formState.courseId)),
    [students, formState.courseId]
  );
  const trainersForCourse = useMemo(
    () => trainers.filter((t) => t.expertise.includes(formState.courseId)),
    [trainers, formState.courseId]
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Assignments</h1>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          Allocate Assignment
        </button>
      </div>

      <Table
        headers={[
          "Title",
          "Student",
          "Course",
          "Due Date",
          "Status",
          "File",
          "Actions",
        ]}
      >
        {assignments.map((assignment: any) => (
          <tr key={assignment.id} className="align-middle">
            <td>{assignment.title}</td>
            <td>{getStudentName(assignment.studentId)}</td>
            <td>{getCourseName(assignment.courseId)}</td>
            <td>{assignment.dueDate.substring(0, 10)}</td>
            <td>
              <span
                className={`badge rounded-pill ${
                  assignment.status === "Submitted"
                    ? "text-bg-success"
                    : "text-bg-secondary"
                }`}
              >
                {assignment.status}
              </span>
            </td>
            <td className="text-center">
              {assignment.attachmentFiles?.length ? (
                <a
                  href={`${window.location.origin}${assignment.attachmentFiles[0].ServerRelativeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DocumentIcon />
                </a>
              ) : (
                <span>-</span>
              )}
            </td>
            <td>
              <div className="d-flex gap-2">
                <button
                  onClick={() => handleOpenModal(assignment)}
                  className="btn btn-sm btn-outline-secondary"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => setAssignmentToDelete(assignment)}
                  className="btn btn-sm btn-outline-danger"
                >
                  <DeleteIcon />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {assignmentToDelete && (
        <ConfirmationModal
          title="Delete Assignment"
          message={`Are you sure you want to delete "${assignmentToDelete.title}"?`}
          onConfirm={handleDelete}
          onCancel={() => setAssignmentToDelete(null)}
        />
      )}

      <Modal
        show={isModalOpen}
        title={
          editingAssignment ? "Edit Assignment" : "Allocate New Assignment"
        }
        onClose={handleCloseModal}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <FormInput
            label="Assignment Title"
            name="title"
            value={formState.title}
            onChange={handleInputChange}
            required
          />
          <FormSelect
            label="Course"
            name="courseId"
            value={formState.courseId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a course</option>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="Student"
            name="studentId"
            value={formState.studentId}
            onChange={handleInputChange}
            required
            disabled={!formState.courseId}
          >
            <option value="">Select a student</option>
            {studentsForCourse.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="Trainer"
            name="trainerId"
            value={formState.trainerId}
            onChange={handleInputChange}
            required
            disabled={!formState.courseId}
          >
            <option value="">Select a trainer</option>
            {trainersForCourse.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Due Date"
            name="dueDate"
            type="date"
            value={formState.dueDate}
            onChange={handleInputChange}
            required
          />
          <FormInput
            label="Assignment File"
            name="assignmentFile"
            type="file"
            onChange={handleFileChange}
          />

          <div className="d-flex justify-content-end pt-3 mt-3 border-top">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary me-2"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingAssignment ? "Save Changes" : "Allocate"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AssignmentsView;
