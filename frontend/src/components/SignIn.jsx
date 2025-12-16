import React, { useState } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import animationData from "../assets/login-animation.json";
import { saveToken, getProfileFromToken, saveProfile } from "../utils/auth";
import { API_BASE_URL } from "../utils/api";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // state for success

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage(""); // reset previous success
    setLoading(true);

    try {
      const base = (API_BASE_URL || '').replace(/\/$/, '');
      const response = await fetch(`${base}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({ email, password }),
      });
   
       
      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();

  // Save JWT token locally (central helper)
  saveToken(data.token);

  // Decode profile from JWT and save for easy retrieval across the app
  const profile = getProfileFromToken(data.token);
  if (profile) saveProfile(profile);

      // Show inline success message
      setSuccessMessage("Login successful! Redirecting...");

      // Determine destination based on role in token
      const role = profile && profile.role ? String(profile.role).toLowerCase() : '';
      let dest = '/dashboard';
      if (role.includes('admin')) dest = '/admindashboard';
      else if (role.includes('user')) dest = '/userdashboard';
      else if (role.includes('storemanager') || role.includes('store_manager') || role.includes('store-manager')) dest = '/dashboard';

      // Navigate after a short delay so the success message is visible
      setTimeout(() => {
        navigate(dest, { replace: true });
      }, 600);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col md:flex-row bg-white shadow-2xl rounded-2xl overflow-hidden w-[750px] max-w-full">
        
        {/* LEFT SIDE – Animation */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="w-64"
          >
            <Lottie animationData={animationData} loop={true} />
          </motion.div>
        </div>

        {/* RIGHT SIDE – Login Form */}
        <div className="w-full md:w-1/2 bg-gray-100 p-8 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">
            Log in
          </h1>

          {/* Display error or success messages */}
          {error && (
            <div className="bg-red-100 text-red-600 text-sm p-2 rounded mb-3 text-center">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 text-green-600 text-sm p-2 rounded mb-3 text-center">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email Id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mb-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
              required
            />

            <input
              type="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mb-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
              required
            />

            <div className="text-right mb-2">
              <a href="#" className="text-xs text-gray-500 hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-all disabled:opacity-60 mb-2"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-1">
            Don't have an account?{" "}
            <a href="/signup" className="text-gray-500 font-medium hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
