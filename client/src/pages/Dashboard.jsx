import React, { useEffect, useState } from 'react'
import { BookOpen, PlusCircle, Trash2, Loader2, Package, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { api } from '../api'

const Dashboard = () => {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.get('/listings/mine')
      .then((data) => { if (alive) setListings(data) })
      .catch(() => { if (alive) toast('Failed to load listings', 'error') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await api.del(`/listings/${id}`)
      setListings((prev) => prev.filter((l) => l.id !== id))
      toast('Listing deleted')
    } catch {
      toast('Failed to delete listing', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back{user?.name ? `, ${user.name}` : ''}! Here's your book selling overview.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-10">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
            <p className="text-sm text-gray-500">Total Listings</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
            <p className="text-sm text-gray-500">Active Listings</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{user?.city || '—'}</p>
            <p className="text-sm text-gray-500">Your Location</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Listings</h2>
          <Link to="/listing" className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm hover:underline">
            <PlusCircle className="w-4 h-4" /> New Listing
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading your listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No listings yet</h3>
            <p className="text-sm text-gray-500 mb-4">List your first book and start selling!</p>
            <Link to="/listing" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
              <PlusCircle className="w-4 h-4" /> List a Book
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Book</th>
                    <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4 hidden sm:table-cell">Category</th>
                    <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Price</th>
                    <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4 hidden md:table-cell">Location</th>
                    <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {l.images && l.images[0] ? (
                              <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">{l.title}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600 hidden sm:table-cell">{l.category || '—'}</td>
                      <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">₹{l.price ?? 0}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-500 text-sm hidden md:table-cell truncate max-w-[150px]">{l.location || '—'}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => handleDelete(l.id, l.title)}
                          disabled={deletingId === l.id}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete listing (after sold)"
                        >
                          {deletingId === l.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Dashboard
