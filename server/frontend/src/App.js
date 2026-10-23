import React from "react"
import LoginPanel from "./components/Login/Login"
import Register from "./components/Register/Register"
import Dealers from "./components/Dealers/Dealers"
import Dealer from "./components/Dealers/Dealer"
import PostReview from "./components/Dealers/PostReview"
import Cars from "./components/Pages/Cars"
import Landing from "./components/Pages/Landing"
import MyReviews from "./components/Pages/MyReviews"
import { ToastProvider, flashToast } from "./components/Toast/Toast"
import { Navigate, Routes, Route, useLocation } from "react-router-dom";

const isLoggedIn = () => {
  const username = sessionStorage.getItem("username");
  return username !== null && username !== "";
};

// The public site opens on the landing page. The working app (dealers,
// dealer details, cars, review posting and My Reviews) is member-only:
// an unauthenticated visit is returned to the landing page with a note.
const RequireAuth = ({ children }) => {
  const loggedIn = isLoggedIn();

  React.useEffect(() => {
    if (!loggedIn) {
      flashToast("Please log in or create an account to access Auto Review Hub.", "error");
      window.location.replace("/");
    }
  }, [loggedIn]);

  return loggedIn ? children : null;
};

const PublicOnly = ({ children }) => (
  isLoggedIn() ? <Navigate to="/dealers" replace /> : children
);

const RootRoute = () => (
  isLoggedIn() ? <Navigate to="/dealers" replace /> : <Landing />
);

const Footer = () => {
  const loggedIn = isLoggedIn();
  return (
    <footer style={{
      borderTop: '1px solid #e1e7ee', marginTop: '40px',
      padding: '22px 16px', textAlign: 'center', color: '#51606e',
      fontSize: '14px',
    }}>
      <div style={{ fontWeight: 600, color: '#123c5e' }}>Auto Review Hub</div>
      <div>
        Dealership reviews with sentiment analysis · Built with Django, React,
        Express and MongoDB
      </div>
      <div style={{ marginTop: '6px' }}>
        <a href={loggedIn ? "/dealers" : "/login"}>Dealers</a> ·{' '}
        <a href={loggedIn ? "/cars" : "/login"}>Cars</a> ·{' '}
        <a href="/about">About Us</a> · <a href="/contact">Contact Us</a>
      </div>
    </footer>
  );
};

function App() {
  const location = useLocation();
  // The auth pages are full-screen split designs; the site footer
  // underneath them just adds an awkward scroll.
  const hideFooter = ['/login', '/register'].includes(location.pathname);
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={
          <PublicOnly><LoginPanel /></PublicOnly>
        } />
        <Route path="/register" element={
          <PublicOnly><Register /></PublicOnly>
        } />
        <Route path="/dealers" element={
          <RequireAuth><Dealers /></RequireAuth>
        } />
        <Route path="/dealer/:id" element={
          <RequireAuth><Dealer /></RequireAuth>
        } />
        <Route path="/postreview/:id" element={
          <RequireAuth><PostReview /></RequireAuth>
        } />
        <Route path="/cars" element={
          <RequireAuth><Cars /></RequireAuth>
        } />
        <Route path="/myreviews" element={
          <RequireAuth><MyReviews /></RequireAuth>
        } />
      </Routes>
      {!hideFooter && <Footer />}
    </ToastProvider>
  );
}
export default App;
