import React from "react";
import { BookOpen, MapPin, Heart, ShoppingCart, Check, Camera, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";

const toNum = (v) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const BookCard = ({ book, onClick, onContact }) => {
  const navigate = useNavigate();
  const {
    addToCart,
    removeFromCart,
    toggleWishlist,
    isInCart,
    isWishlisted,
  } = useShop();

  const price = toNum(book.price);
  const original = toNum(book.originalPrice);
  const isExchange = book.listingType === "exchange" || price === null;
  const isRent = book.listingType === "rent";
  const inCart = isInCart(book);
  const wishlisted = isWishlisted(book);
  const off =
    !isRent && !isExchange && price && original && original >= price
      ? Math.round((1 - price / original) * 100)
      : null;

  const tagText = book.condition || (isExchange ? "Exchange" : isRent ? "For Rent" : "");
  const tagCls = tagText
    ? isRent && !book.condition
      ? "text-blue-600 bg-blue-50"
      : isExchange && !book.condition
        ? "text-purple-600 bg-purple-50"
        : "text-emerald-600 bg-emerald-50"
    : "opacity-0 select-none";

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="relative">
        {book.featured && (
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 text-[11px] font-bold uppercase bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full shadow-sm">
            <Star className="w-3 h-3 fill-yellow-900" /> Featured
          </span>
        )}
        {book.images && book.images.length > 0 ? (
          <>
            <img
              src={book.images[0]}
              alt={book.title}
              className="w-full aspect-[4/3] object-cover"
            />
            {book.images.length > 1 && (
              <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 text-[11px] font-semibold bg-black/55 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" /> {book.images.length}
              </span>
            )}
          </>
        ) : (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        )}
        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(book);
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full shadow-sm flex items-center justify-center transition-all active:scale-90 ${
            wishlisted
              ? "bg-red-50 text-red-500 ring-1 ring-red-200"
              : "bg-white/90 text-gray-400 hover:text-red-500"
          }`}
        >
          <Heart className={`w-[18px] h-[18px] ${wishlisted ? "fill-red-500" : ""}`} />
        </button>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full truncate ${tagCls}`}>
            {tagText || "—"}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
            <MapPin className="w-3 h-3" />
            {book.distance}
          </span>
        </div>
        {book.address && (
          <p className="text-xs text-gray-400 flex items-start gap-1 mb-2 truncate">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            {book.address}
          </p>
        )}
        <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">
          {book.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3">
          <span className={`text-2xl font-extrabold ${isExchange ? "text-green-600" : "text-emerald-600"}`}>
            {isExchange ? "Free" : book.price}
          </span>
          {isRent ? (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              rent / {book.rentDays || 40} days
            </span>
          ) : (
            original &&
            !isExchange && (
              <>
                <span className="text-sm text-gray-400 line-through">
                  ₹{original}
                </span>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                  {off}% off
                </span>
              </>
            )
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-sm text-gray-500 truncate">by {book.seller}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              (onContact || onClick)?.();
            }}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
          >
            Contact
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (inCart) navigate("/cart");
            else addToCart(book);
          }}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            inCart
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {inCart ? (
            <>
              <Check className="w-4 h-4" /> In Cart — View
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookCard;
