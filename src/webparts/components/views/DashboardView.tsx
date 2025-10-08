import * as React from 'react';
import Card from '../common/Card';
import { useMockData } from '../../hooks/useMockData';
import MonthlyFinancialChart from './MonthlyFinancialChart';
import {
  UsersIcon,
  BriefcaseIcon,
  BookOpenIcon,
  CurrencyDollarIcon
} from './ Icons';

const cardColors = {
  students: { bg: 'bg-primary-subtle', icon: 'text-primary' },
  trainers: { bg: 'bg-success-subtle', icon: 'text-success' },
  courses: { bg: 'bg-warning-subtle', icon: 'text-warning' },
  revenue: { bg: 'bg-info-subtle', icon: 'text-info' },
};

const DashboardView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
  const { students, courses, trainers, feePayments, expenses } = data;
  const totalRevenue = feePayments.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const activeStudentsCount = students.filter(s => s.status === 'Active').length;

  const processMonthlyData = () => {
    const monthlyData: { [key: string]: { Revenue: number, Expenses: number } } = {};
    const processItems = (items: any[], type: 'Revenue' | 'Expenses') => {
      items.forEach(item => {
        if (type === 'Revenue' && item.status !== 'Paid') return;
        const dateStr = type === 'Revenue' ? item.date : item.Date;
        const amount = type === 'Revenue' ? item.amount : item.Amount;
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return;
        const month = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) monthlyData[month] = { Revenue: 0, Expenses: 0 };
        monthlyData[month][type] += Number(amount) || 0;
      });
    };

    processItems(feePayments, 'Revenue');
    processItems(expenses, 'Expenses');

    return Object.keys(monthlyData).map(month => ({
      name: month,
      ...monthlyData[month],
    }));
  };

  const chartData = processMonthlyData();

  return (
    <div>
      <h1 className="h2 mb-4">Dashboard</h1>

      {/* Stats cards */}
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

      {/* Chart + Recent Activity */}
      <div className="row g-4" style={{ alignItems: 'stretch' }}>
        {/* Chart */}
        <div className="col-lg-6 d-flex">
          <div className="card shadow-sm w-100 d-flex flex-column">
            <div className="card-header">
              <h2 className="h5 mb-0">Monthly Financial Overview</h2>
            </div>
            <div className="card-body" style={{ flex: 1, minHeight: '350px' }}>
              <MonthlyFinancialChart chartData={chartData} />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-lg-6 d-flex">
          <div className="card shadow-sm w-100 d-flex flex-column">
            <div className="card-header">
              <h2 className="h5 mb-0">Recent Activity</h2>
            </div>
            <div className="card-body" style={{ flex: 1 }}>
              <ul className="list-group list-group-flush">
                {feePayments.slice(-3).reverse().map(fee => {
                  const student = students.find(s => s.id === fee.studentId);
                  return (
                    <li key={fee.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>Fee from <span className="text-primary fw-semibold">{student?.name}</span></span>
                      <span className="fw-bold text-success">₹{fee.amount}</span>
                    </li>
                  );
                })}
                {expenses.slice(-2).reverse().map(expense => (
                  <li key={expense.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>Expense: <span className="text-danger fw-semibold">{expense.Description}</span></span>
                    <span className="fw-bold text-danger">-₹{expense.Amount}</span>
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

export default DashboardView;