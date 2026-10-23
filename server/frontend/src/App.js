import LoginPanel from "./components/Login/Login"
import Register from "./components/Register/Register"
import Dealers from "./components/Dealers/Dealers"
import Dealer from "./components/Dealers/Dealer"
import PostReview from "./components/Dealers/PostReview"
import Cars from "./components/Pages/Cars"
import MyReviews from "./components/Pages/MyReviews"
import { ToastProvider } from "./components/Toast/Toast"
import { Routes, Route } from "react-router-dom";

const Footer = () => (
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
      <a href="/dealers">Dealers</a> · <a href="/cars">Cars</a> ·{' '}
      <a href="/about">About Us</a> · <a href="/contact">Contact Us</a>
    </div>
  </footer>
);

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Dealers/>} />
        <Route path="/login" element={<LoginPanel />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dealers" element={<Dealers/>} />
        <Route path="/dealer/:id" element={<Dealer/>} />
        <Route path="/postreview/:id" element={<PostReview/>} />
        <Route path="/cars" element={<Cars/>} />
        <Route path="/myreviews" element={<MyReviews/>} />
      </Routes>
      <Footer />
    </ToastProvider>
  );
}
export default App;
