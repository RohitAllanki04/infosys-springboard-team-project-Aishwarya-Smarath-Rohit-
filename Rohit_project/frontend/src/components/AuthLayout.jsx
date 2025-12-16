import React, { useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import { getProfileFromToken, getToken, getProfile } from '../utils/auth'
import { isAdmin, isUser, isStoreManager } from '../utils/roles'

const AuthLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Try to get profile/role from localStorage (saved profile) first,
    // then fall back to decoding the token.
    const token = getToken()
    const storedProfile = getProfile()
    let role = storedProfile && storedProfile.role ? storedProfile.role : null

    if (!role && token) {
      const payload = getProfileFromToken(token)
      if (payload && payload.role) role = payload.role
    }

    // if neither token nor role, force sign in
    if (!token && !role) {
      navigate('/SignIn', { replace: true })
      return
    }

    const path = (location.pathname || '').toLowerCase()
  const nrole = (role || '').toString().toLowerCase()

    // Redirect logic:
    // - storemanager -> /dashboard
    // - admin -> /admindashboard
    // - user -> /userdashboard
    // Only redirect when the current path is a dashboard root to avoid interfering with other pages.
    if (path === '/dashboard' || path === '/dashboard/') {
      if (isAdmin(nrole)) navigate('/admindashboard', { replace: true })
      else if (isUser(nrole)) navigate('/userdashboard', { replace: true })
      // storemanager should stay on /dashboard
    }

    // If someone lands on admin dashboard but is not admin, send them to their dashboard
    if (path === '/admindashboard' || path === '/admindashboard/') {
      if (!isAdmin(nrole)) {
        if (isStoreManager(nrole)) navigate('/dashboard', { replace: true })
        else if (isUser(nrole)) navigate('/userdashboard', { replace: true })
      }
    }

    if (path === '/userdashboard' || path === '/userdashboard/') {
      if (!isUser(nrole)) {
        if (isStoreManager(nrole)) navigate('/dashboard', { replace: true })
        else if (isAdmin(nrole)) navigate('/admindashboard', { replace: true })
      }
    }
  }, [location.pathname, navigate])

  // decide which navbar to render
  const token = getToken()
  const storedProfile = getProfile()
  const resolvedRole = storedProfile && storedProfile.role ? storedProfile.role : (token ? (getProfileFromToken(token) || {}).role : null)

  const navbar = useMemo(() => {
    return <Navbar role={resolvedRole} />
  }, [resolvedRole])

  return (
    <div className="min-h-screen bg-gray-50">
      {navbar}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayout
