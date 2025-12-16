import React, { useEffect, useState } from 'react'
import { getProfile, getProfileFromToken, removeToken, getToken } from '../utils/auth'
import { getCurrentProfile, deleteCurrentProfile } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rawToken, setRawToken] = useState(null)

  useEffect(() => {
    // small helper to (re)load profile from storage / token / server
    async function loadProfile() {
      setError(null)
      setLoading(true)
      try {
        const stored = getProfile()
        setRawToken(getToken())
        if (stored) {
          setProfile(stored)
          return
        }

        // Try fetching current profile from server (will use token)
        try {
          const data = await getCurrentProfile()
          if (data) setProfile(data)
          else {
            const fromToken = getProfileFromToken()
            if (fromToken) setProfile(fromToken)
          }
        } catch (err) {
          console.debug('getCurrentProfile failed', err)
          const fromToken = getProfileFromToken()
          if (fromToken) setProfile(fromToken)
          setError('Failed to fetch full profile from server')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  // expose a manual refresh so user can retry fetching profile without reload
  const refreshProfile = async () => {
    setError(null)
    setLoading(true)
    try {
      setRawToken(getToken())
      const data = await getCurrentProfile()
      if (data) setProfile(data)
      else {
        const fromToken = getProfileFromToken()
        if (fromToken) setProfile(fromToken)
      }
    } catch (err) {
      console.debug('refreshProfile failed', err)
      setError('Refresh failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    navigate('/signin')
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? This is irreversible. Are you sure?')) return;
    setError(null)
    setLoading(true)
    try {
      // delete current authenticated profile
      await deleteCurrentProfile()
      // logout and redirect
      removeToken()
      navigate('/signin')
    } catch (err) {
      console.debug('delete account failed', err)
      setError(err?.response?.data?.message ?? err.message ?? 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="mt-4 text-gray-600">No profile available. Please sign in.</p>
        <div className="mt-3">
          <button onClick={refreshProfile} className="px-4 py-2 bg-blue-600 text-white rounded mr-2 hover:bg-blue-700 transition">Refresh profile</button>
          <button onClick={() => { const t = getToken(); alert(t ? 'Token exists' : 'No token'); }} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">Check token</button>
        </div>
        {rawToken && (
          <div className="mt-3 text-xs text-gray-500 break-all">
            <div className="font-medium">Raw token (truncated):</div>
            <div>{String(rawToken).slice(0, 100)}{String(rawToken).length > 100 ? '…' : ''}</div>
          </div>
        )}
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="bg-white shadow rounded-lg p-6 max-w-xl">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm text-gray-500">Full name</label>
            <div className="font-medium">{profile.fullName || '-'}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Company</label>
            <div className="font-medium">{profile.companyName || '-'}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <div className="font-medium">{profile.email || '-'}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Role</label>
            <div className="font-medium">{profile.role || '-'}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Contact Number</label>
            <div className="font-medium">{profile.contactNumber || '-'}</div>
          </div>
          <div>
            <label className="text-sm text-gray-500">Warehouse Location</label>
            <div className="font-medium">{profile.warehouseLocation || '-'}</div>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={() => navigate('/profile/edit')}
            className="px-4 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300 transition"
          >
            Edit Profile
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
