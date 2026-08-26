import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Home, ArrowLeft } from 'lucide-react'

const NotFound = () => (
  <section className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <BookOpen className="w-10 h-10 text-emerald-600" />
      </div>
      <p className="font-script text-7xl text-gradient-amber font-bold leading-none">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mt-4">Page not found</h1>
      <p className="text-gray-500 mt-2">
        Looks like this book fell off the shelf. Let's head back home.
      </p>
      <div className="flex items-center justify-center gap-3 mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
        >
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-gray-200 hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  </section>
)

export default NotFound
