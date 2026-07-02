import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import TodoApp from "./components/TodoApp";
import { ProtectedRoute } from "./route/ProtectedRoute";
import { AuthProvider } from "./store/AuthContext";


function App() {
  const protectedTodoApp = (
    <ProtectedRoute>
      <TodoApp />
    </ProtectedRoute>
  );

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={protectedTodoApp} />
          <Route path="/app" element={protectedTodoApp} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
