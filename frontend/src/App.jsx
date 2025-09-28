import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { CustomThemeProvider } from './contexts/ThemeContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import EmailVerificationPage from './pages/EmailVerificationPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreatePlannerPage from './pages/CreatePlannerPage.jsx';
import EditPlannerPage from './pages/EditPlannerPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';
import TeamDetailPage from './pages/TeamDetailPage.jsx';
import PlannersPage from './pages/PlannersPage.jsx';
import PlannerDetailPage from './pages/PlannerDetailPage.jsx';
import PostsPage from './pages/PostsPage.jsx';
import CreatePostPage from './pages/CreatePostPage.jsx';
import EditPostPage from './pages/EditPostPage.jsx';
import PostDetailPage from './pages/PostDetailPage.jsx';
import TodosPage from './pages/TodosPage.jsx';
import TodoDetailPage from './pages/TodoDetailPage.jsx';
import EditTodoPage from './pages/EditTodoPage.jsx';
import EditTeamPage from './pages/EditTeamPage.jsx';
import PlannerTodoRecommendationPage from './pages/PlannerTodoRecommendationPage.jsx';
import MyPage from './pages/MyPage.jsx';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-verification" element={<EmailVerificationPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<ProtectedRoute><TeamDetailPage /></ProtectedRoute>} />
        <Route path="/teams/:id/edit" element={<ProtectedRoute><EditTeamPage /></ProtectedRoute>} />
        <Route path="/planners" element={<ProtectedRoute><PlannersPage /></ProtectedRoute>} />
        <Route path="/planners/create" element={<ProtectedRoute><CreatePlannerPage /></ProtectedRoute>} />
        <Route path="/planners/:id" element={<ProtectedRoute><PlannerDetailPage /></ProtectedRoute>} />
        <Route path="/planners/:id/edit" element={<ProtectedRoute><EditPlannerPage /></ProtectedRoute>} />
        <Route path="/posts" element={<ProtectedRoute><PostsPage /></ProtectedRoute>} />
        <Route path="/posts/:id/edit" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
        <Route path="/posts/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
        <Route path="/posts/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
        <Route path="/todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
        <Route path="/todos/:id" element={<ProtectedRoute><TodoDetailPage /></ProtectedRoute>} />
        <Route path="/todos/:id/edit" element={<ProtectedRoute><EditTodoPage /></ProtectedRoute>} />
        <Route path="/planners/:id/todo-recommendations" element={<ProtectedRoute><PlannerTodoRecommendationPage /></ProtectedRoute>} />
        <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <CustomThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  );
};

export default App;