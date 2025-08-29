import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import CreatePlannerPage from './pages/CreatePlannerPage';
import EditPlannerPage from './pages/EditPlannerPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import PlannersPage from './pages/PlannersPage';
import PlannerDetailPage from './pages/PlannerDetailPage';
import PostsPage from './pages/PostsPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import PostDetailPage from './pages/PostDetailPage';
import TodosPage from './pages/TodosPage';
import TodoDetailPage from './pages/TodoDetailPage';
import EditTodoPage from './pages/EditTodoPage';
import EditTeamPage from './pages/EditTeamPage';
import PlannerTodoRecommendationPage from './pages/PlannerTodoRecommendationPage';
import MyPage from './pages/MyPage';

// 보호된 라우트 컴포넌트
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/email-verification" element={<EmailVerificationPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:id"
          element={
            <ProtectedRoute>
              <TeamDetailPage />
            </ProtectedRoute>
          }
        />
                    <Route
              path="/teams/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTeamPage />
                </ProtectedRoute>
              }
            />
        <Route
          path="/planners"
          element={
            <ProtectedRoute>
              <PlannersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planners/create"
          element={
            <ProtectedRoute>
              <CreatePlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planners/:id"
          element={
            <ProtectedRoute>
              <PlannerDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planners/:id/edit"
          element={
            <ProtectedRoute>
              <EditPlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <PostsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id/edit"
          element={
            <ProtectedRoute>
              <EditPostPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/create"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <ProtectedRoute>
              <PostDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/todos"
          element={
            <ProtectedRoute>
              <TodosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/todos/:id"
          element={
            <ProtectedRoute>
              <TodoDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/todos/:id/edit"
          element={
            <ProtectedRoute>
              <EditTodoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planners/:id/todo-recommendations"
          element={
            <ProtectedRoute>
              <PlannerTodoRecommendationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
