import * as React from 'react';
import Card from '../common/Card';
import { useMockData } from '../../hooks/useMockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const cardColors = {
    students: { bg: 'bg-primary-subtle', icon: 'text-primary' },
    trainers: { bg: 'bg-success-subtle', icon: 'text-success' },
    courses: { bg: 'bg-warning-subtle', icon: 'text-warning' },
    revenue: { bg: 'bg-info-subtle', icon: 'text-info' },
}

const DashboardView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { students, trainers, courses, feePayments, expensesData } = data;

    const totalRevenue = feePayments.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
    const activeStudentsCount = students.filter(s => s.status === 'Active').length;
    
    const processMonthlyData = () => {
        const monthlyData: { [key: string]: { Revenue: number, Expenses: number } } = {};
        const processItems = (items: (typeof feePayments | typeof expensesData), type: 'Revenue' | 'Expenses') => {
            items.forEach(item => {
                if (type === 'Revenue' && (item as any).status !== 'Paid') return;
    
                const month = new Date(item.date).toLocaleString('default', { month: 'short', year: 'numeric' });
                if (!monthlyData[month]) {
                    monthlyData[month] = { Revenue: 0, Expenses: 0 };
                }
                monthlyData[month][type] += item.amount;
            });
        };
    
        processItems(feePayments, 'Revenue');
        processItems(expensesData, 'Expenses');
        
        const chartData = Object.keys(monthlyData).map(month => ({
            name: month,
            ...monthlyData[month]
        })).sort((a, b) => new Date(a.name).getTime() - (new Date(b.name).getTime())); // Use getTime() for proper sorting
    
        return chartData;
    };
    
    const chartData = processMonthlyData();

    return (
        <div>
            <h1 className="h2 mb-4">Dashboard</h1>
            
            <div className="row g-4 mb-5">
                <div className="col-12 col-sm-6 col-lg-3">
                    <Card title="Active Students" value={activeStudentsCount} icon={<UsersIcon />} colors={cardColors.students} />
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                    <Card title="Total Trainers" value={trainers.length} icon={<BriefcaseIcon />} colors={cardColors.trainers} />
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                    <Card title="Total Courses" value={courses.length} icon={<BookOpenIcon />} colors={cardColors.courses} />
                </div>
                <div className="col-12 col-sm-6 col-lg-3">
                    <Card title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={<CurrencyDollarIcon />} colors={cardColors.revenue} />
                </div>
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h2 className="h5 mb-0">Monthly Financial Overview</h2>
                        </div>
                        <div className="card-body">
                            {/* REPLACE THIS SECTION WITH THE RECHARTS COMPONENTS */}
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 5,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Revenue" fill="#8884d8" /> {/* Blue color for Revenue */}
                                    <Bar dataKey="Expenses" fill="#ff4d4d" /> {/* Red color for Expenses */}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                <div className="col-lg-5">
                    <div className="card shadow-sm h-100">
                        <div className="card-header">
                            <h2 className="h5 mb-0">Recent Activity</h2>
                        </div>
                        <div className="card-body">
                             <ul className="list-group list-group-flush">
                                {feePayments.slice(-3).reverse().map(fee => {
                                    const student = students.find(s => s.id === fee.studentId);
                                    return (
                                        <li key={fee.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>Fee from <span className="text-primary fw-semibold">{student?.name}</span></span>
                                            <span className={`fw-bold ${fee.status === 'Paid' ? 'text-success' : 'text-warning'}`}>₹{fee.amount}</span>
                                        </li>
                                    );
                                })}
                                {expensesData.slice(-2).reverse().map(expense => (
                                    <li key={expense.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>Expense: <span className="text-danger fw-semibold">{expense.description}</span></span>
                                        <span className="fw-bold text-danger">-₹{expense.amount}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// SVG Icons from Sidebar for reuse
const UsersIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const BriefcaseIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const BookOpenIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);
const CurrencyDollarIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 12v-2m0 2v.01m0 4v-2m0 2v.01M6 12h.01M18 12h.01M6 12a6 6 0 1112 0 6 6 0 01-12 0z" />
  </svg>
);

export default DashboardView;