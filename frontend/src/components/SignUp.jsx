import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { motion } from "framer-motion";
import animationData from "../assets/login-animation.json";
import { signup } from "../utils/api";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    contactNumber: "",
    warehouseLocation: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // <-- New state for success

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage(""); // reset success message

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signup({
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        contactNumber: formData.contactNumber,
        warehouseLocation: formData.warehouseLocation,
      });

      setSuccessMessage("Account created successfully! Redirecting...");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col md:flex-row bg-white shadow rounded-lg overflow-hidden w-[750px] max-w-full">
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

        {/* RIGHT SIDE – Sign Up Form */}
  <div className="w-full md:w-1/2 bg-white p-8 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Sign Up
          </h1>

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

          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Inputs here */}
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            />
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            />
            <input
              type="email"
              name="email"
              placeholder="Official Email ID"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            >
              <option value="" disabled>
                Select Role
              </option>
              <option value="ADMIN">Admin</option>
              <option value="STORE_MANAGER">Store Manager</option>
              <option value="USER">User</option>
            </select>
            <input
              type="tel"
              name="contactNumber"
              placeholder="Contact Number"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            />
            <input
              type="text"
              name="warehouseLocation"
              placeholder="Warehouse Location"
              value={formData.warehouseLocation}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white hover:border-gray-400 transition input-compact"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-gray-800 py-2 rounded-lg text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-2">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-gray-500 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
