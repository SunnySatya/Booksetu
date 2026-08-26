import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { useShop } from "../context/ShopContext";
import BookCard from "../components/BookCard";
import ContactModal from "../components/ContactModal";

const Wishlist = () => {
  const { wishlist } = useShop();
  const [contactBook, setContactBook] = useState(null);

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500">
            {wishlist.length > 0
              ? `${wishlist.length} books saved for later`
              : "Save books you like here"}
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Wishlist is empty</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Tap the heart icon on books to save them here
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Browse Books <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((book, i) => (
              <BookCard
                key={`${book.title}-${book.seller}-${i}`}
                book={book}
                onContact={() => setContactBook(book)}
              />
            ))}
          </div>
        )}
      </div>

      {contactBook && (
        <ContactModal book={contactBook} onClose={() => setContactBook(null)} />
      )}
    </section>
  );
};

export default Wishlist;
