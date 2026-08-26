import React from 'react'
import { BookOpen, Package, Truck, TrendingUp, DollarSign, Eye, PlusCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const stats = [
  { label: "Active Listings", value: "3", icon: BookOpen, bg: "bg-emerald-100", text: "text-emerald-600" },
  { label: "Books Sold", value: "12", icon: TrendingUp, bg: "bg-blue-100", text: "text-blue-600" },
  { label: "Total Earnings", value: "₹2,450", icon: DollarSign, bg: "bg-purple-100", text: "text-purple-600" },
  { label: "Pending Orders", value: "2", icon: Truck, bg: "bg-orange-100", text: "text-orange-600" },
]

const recentOrders = [
  { id: 1, book: "NCERT Biology Class 11", buyer: "Amit K.", status: "Delivered", price: "₹95", date: "2 days ago" },
  { id: 2, book: "Calculus by Stewart", buyer: "Priya S.", status: "In Transit", price: "₹180", date: "3 days ago" },
  { id: 3, book: "History of Modern India", buyer: "Rahul M.", status: "Pending", price: "₹60", date: "5 days ago" },
]

const statusColors = {
  "Delivered": "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  "Pending": "bg-yellow-100 text-yellow-700",
}

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back{user?.name ? `, ${user.name}` : ''}! Here's your book selling overview.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.text}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <Link to="/listing" className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm hover:underline">
            <PlusCircle className="w-4 h-4" /> New Listing
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Book</th>
                  <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Buyer</th>
                  <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Price</th>
                  <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Status</th>
                  <th className="text-left text-sm font-semibold text-gray-500 px-4 sm:px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-gray-900">{order.book}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600">{order.buyer}</td>
                    <td className="px-4 sm:px-6 py-4 font-semibold text-gray-900">{order.price}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-500 text-sm">{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Dashboard
