import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "./Contexts/AuthContext";

import Home from "./Routes/Home";
import Trades from "./Routes/Trades";
import PNL from "./Routes/PNL";
import Login from "./Routes/Login";
import About from "./Routes/About";
import Stocks from "./Routes/Stocks";
import SignUp from "./Routes/SignUp";
import Pricing from "./Routes/Pricing";
import Navbar from "./Components/Layout/NavbarNew";
import ProtectedRoute from "./Components/Layout/ProtectedRoute";

const Routing = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const hideNavbar =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      <Navbar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route path="/trades" element={<Trades />} />
          <Route path="/p&l" element={<PNL />} />
          <Route path="/stocks" element={<Stocks />} />
        </Route>
      </Routes>
    </>
  );
};

export default Routing;
