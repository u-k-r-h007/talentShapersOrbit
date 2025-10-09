import * as React from 'react';
import { useMockData } from '../../hooks/useMockData';

interface StudentProfileProps {
    studentId: string;
    data: ReturnType<typeof useMockData>;
    onBack: () => void;
}

const StudentProfileView: React.FC<StudentProfileProps> = ({ studentId, data, onBack }) => {
    const { students, feePayments, courses, assignments} = data;
    const student = students.find(s => s.id === studentId);
    const studentCourses = courses.filter(c => student?.courseIds.includes(c.id));
    const payments = feePayments.filter(p => p.studentId === studentId);
    const studentAssignments = assignments.filter(a => a.studentId === studentId);

    if (!student) {
        return (
            <div className="text-center">
                <h1 className="h3">Student not found.</h1>
                <button onClick={onBack} className="mt-4 btn btn-primary">Back to List</button>
            </div>
        );
    }
    const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
    const totalFee = studentCourses.reduce((sum, course) => sum + course.totalFee, 0);
    const balanceDue = totalFee - totalPaid;
    const paymentProgress = totalFee > 0 ? (totalPaid / totalFee) * 100 : 0;

    return (
        <div className="container-fluid p-0">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-5">
                <div className="d-flex align-items-center">
                     <img src={student.imageUrl || `https://ui-avatars.com/api/?name=${student.name.replace(' ', '+')}&background=random`} alt={student.name} className="rounded-circle object-fit-cover shadow-sm me-4" width="80" height="80" />
                    <div>
                        <button onClick={onBack} className="btn btn-link p-0 d-flex align-items-center text-decoration-none mb-1">
                            <svg className="me-1" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                            Back to Students
                        </button>
                        <h1 className="h2 mb-0 text-body dark:text-white">
                            {student.name}
                        </h1>
                        <p className="text-body-secondary mt-1">{student.email} &bull; {student.phone}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="row g-4">
                {/* Left Column */}
                <div className="col-lg-4">
                    <div className="d-flex flex-column gap-4">
                        {/* Student Details */}
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h3 className="h5 mb-0">Details</h3>
                            </div>
                            <div className="card-body">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-body-secondary">Join Date</span>
                                    <span className="fw-semibold">{student.joinDate}</span>
                                </div>
                                <div className="mb-3">
                                    <span className="text-body-secondary d-block mb-1">Address</span>
                                    <span className="fw-semibold">{student.address || 'N/A'}</span>
                                </div>
                                <div className="pt-3 border-top">
                                    <span className="text-body-secondary d-block mb-1">Enrolled Courses</span>
                                    <div className="d-flex flex-column">
                                        {studentCourses.map(c => (
                                            <span key={c.id} className="fw-semibold">{c.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h3 className="h5 mb-0">Financials</h3>
                            </div>
                            <div className="card-body">
                                <div className="progress mb-3" style={{height: "10px"}}>
                                    <div className="progress-bar" role="progressbar" style={{ width: `${paymentProgress}%` }} aria-valuenow={paymentProgress} aria-valuemin={0} aria-valuemax={100}></div>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-body-secondary">Total Fee</span>
                                    <span className="fw-semibold">₹{totalFee.toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-body-secondary">Amount Paid</span>
                                    <span className="fw-semibold text-success">₹{totalPaid.toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between pt-2 border-top">
                                    <span className="fw-bold">Balance Due</span>
                                    <span className="fw-bold text-danger">₹{balanceDue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-lg-8">
                     <div className="d-flex flex-column gap-4">
                        {/* Payment History */}
                        <div className="card shadow-sm">
                             <div className="card-header">
                                <h3 className="h5 mb-0">Payment History</h3>
                             </div>
                             <div className="table-responsive" style={{maxHeight: '250px'}}>
                                <table className="table table-striped table-sm mb-0">
                                    <thead className="sticky-top">
                                        <tr>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Method</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => (
                                            <tr key={p.id}>
                                                <td className="p-3">{p.date}</td>
                                                <td className="p-3 fw-semibold">₹{p.amount.toLocaleString()}</td>
                                                <td className="p-3">{p.paymentMethod}</td>
                                                <td className="p-3">
                                                    <span className={`badge rounded-pill ${ p.status === 'Paid' ? 'text-bg-success' : 'text-bg-warning' }`}>{p.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Assignments */}
                        <div className="card shadow-sm">
                            <div className="card-header">
                                <h3 className="h5 mb-0">Assignments</h3>
                            </div>
                            <div className="table-responsive" style={{maxHeight: '250px'}}>
                                <table className="table table-striped table-sm mb-0">
                                    <thead className="sticky-top">
                                        <tr>
                                            <th className="p-3">Title</th>
                                            <th className="p-3">Course</th>
                                            <th className="p-3">Due Date</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentAssignments.map(a => (
                                            <tr key={a.id}>
                                                <td className="p-3 fw-semibold">{a.title}</td>
                                                <td className="p-3">{courses.find(c=>c.id === a.courseId)?.name || 'N/A'}</td>
                                                <td className="p-3">{a.dueDate.substring(0,10)}</td>
                                                <td className="p-3">
                                                    <span className={`badge rounded-pill ${ a.status === 'Submitted' ? 'text-bg-success' : 'text-bg-secondary' }`}>{a.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfileView;