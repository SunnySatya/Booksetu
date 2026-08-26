import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, MapPin, Trash2, ArrowRight, MessageCircle } from "lucide-react";
import { useShop } from "../context/ShopContext";
import ContactModal from "../components/ContactModal";

const priceNum = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useShop();
  const [contactBook, setContactBook] = useState(null);

  const total = cart.reduce((sum, b) => sum + priceNum(b.price), 0);
  const savings = cart.reduce(
    (sum, b) => Math.max(0, priceNum(b.originalPrice) - priceNum(b.price)) + sum,
    0,
  );

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Cart</h1>
            <p className="text-gray-500">{cart.length} books ready to pick up</p>
          </div>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-full transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Your cart is empty</h2>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Browse books and add your favorites to cart
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Browse Books <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="space-y-3">
              {cart.map((book) => (
                <div
                  key={`${book.title}-${book.seller}`}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4"
                >
                  <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50">
                    {book.images && book.images[0] ? (
                      <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-emerald-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 truncate">{book.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">by {book.seller}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      {book.condition && <span>{book.condition} •</span>}
                      <MapPin className="w-3 h-3" /> {book.distance}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`font-extrabold ${String(book.price).toLowerCase() === "free" ? "text-green-600" : "text-emerald-600"}`}>
                        {book.price}
                      </span>
                      {priceNum(book.originalPrice) > priceNum(book.price) && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{priceNum(book.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end shrink-0">
                    <button
                      type="button"
                      onClick={() => removeFromCart(book)}
                      aria-label="Remove from cart"
                      className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactBook(book)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:sticky lg:top-24">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Books</span>
                  <span className="font-semibold text-gray-900">{cart.length}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">You save</span>
                    <span className="font-semibold text-green-600">₹{savings}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-semibold text-gray-900">Self pickup</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between text-base">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-emerald-600">
                    {total === 0 && cart.every((b) => String(b.price).toLowerCase() === "free")
                      ? "Free"
                      : `₹${total}`}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                Payment is direct to seller on BookSetu — tap "Contact" to
                chat or WhatsApp.
              </p>
            </div>
          </div>
        )}
      </div>

      {contactBook && (
        <ContactModal book={contactBook} onClose={() => setContactBook(null)} />
      )}
    </section>
  );
};

export default Cart;
