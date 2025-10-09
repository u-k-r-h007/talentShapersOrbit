import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import StudentsView from './components/views/StudentsView';
import StudentProfileView from './components/views/StudentProfileView';
import TrainersView from './components/views/TrainersView';
import CoursesView from './components/views/CoursesView';
import FeesView from './components/views/FeesView';
import ExpensesView from './components/views/ExpensesView';
import AssignmentsView from './components/views/AssignmentsView';
import { useMockData } from './hooks/useMockData';

export type ViewType = 'dashboard' | 'students' | 'trainers' | 'courses' | 'fees' | 'expenses' | 'assignments';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  const mockData = useMockData();

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleViewProfile = (studentId: string) => {
    setSelectedStudentId(studentId);
  };
  
  const handleBackToList = () => {
    setSelectedStudentId(null);
  };

  const handleSidebarNavigation = (view: ViewType) => {
    setActiveView(view);
    setSelectedStudentId(null);
  };

  const renderView = () => {
    if (selectedStudentId) {
      return <StudentProfileView studentId={selectedStudentId} data={mockData} onBack={handleBackToList} />;
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardView data={mockData} />;
      case 'students':
        return <StudentsView data={mockData} onViewProfile={handleViewProfile} />;
      case 'trainers':
        return <TrainersView data={mockData} />;
      case 'courses':
        return <CoursesView data={mockData} />;
      case 'fees':
        return <FeesView data={mockData} />;
      case 'expenses':
        return <ExpensesView data={mockData} />;
      case 'assignments':
        return <AssignmentsView data={mockData} />;
      default:
        return <DashboardView data={mockData} />;
    }
  };

  return (
    <div className="d-flex vh-100 bg-body-tertiary">
      <Sidebar activeView={activeView} setActiveView={handleSidebarNavigation} theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow-1 p-4 p-md-5 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
