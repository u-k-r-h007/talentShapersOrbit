import { useEffect, useState } from "react";
import { web } from "../../PnpUrl";

export function FeePaymentMethods() {
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Fetch students for lookup mapping
  const fetchStudents = async () => {
    try {
      const items = await web.lists.getByTitle("TshapersStudent").items
        .select("Id,Title")
        .get();
      const mapped = items.map((item: any) => ({
        id: item.Id.toString(),
        name: item.Title,
      }));
      setStudents(mapped);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Fetch fee payments with student lookup
  const fetchFeePayments = async () => {
    try {
      const items = await web.lists.getByTitle("TsharpersFeeCollection").items
        .select("Id,Title,Student/ID,Student/Title,Amount,Date,Status,PaymentMethod")
        .expand("Student")
        .get();
        console.log('actually data ', items)

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
    fetchStudents();
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
      await web.lists.getByTitle("TsharpersFeeCollection").items
        .getById(parseInt(updatedPayment.id))
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
      await web.lists.getByTitle("TsharpersFeeCollection").items.getById(parseInt(paymentId)).delete();
      setFeePayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (err) {
      console.error("Error deleting fee payment:", err);
    }
  };

  return {
    feePayments,
    students,
    addFeePayment,
    updateFeePayment,
    deleteFeePayment,
    fetchFeePayments,
    fetchStudents,
  };
}
