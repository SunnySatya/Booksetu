import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Lightbulb,
  MapPin,
  Star,
  ArrowRight,
  Search,
  Package,
  Truck,
  Clock,
  Flame,
  Eye,
  BookMarked,
  Lock,
  X,
} from "lucide-react";
import {
  DEFAULT_HERO_IMAGES,
  getCustomHeroImages,
  getCustomQuotes,
  getCategoryImages,
  CONTENT_EVENT,
} from "../utils/contentStore";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  quotes,
  categories,
  featuredBooks,
  heroSlides,
  trendingBooks as defaultTrending,
  mustReadBooks as defaultMustRead,
  TRENDING_CATEGORY_MAP,
  EXTRA_CATEGORY_BOOKS,
} from "../data/homeData";
import ContactModal from "../components/ContactModal";
import CategorySlider from "../components/CategorySlider";
import BookCard from "../components/BookCard";
import useGeolocation from "../hooks/useGeolocation";
import { getAllListings } from "../utils/listingStore";
import {
  getTrendingBooks,
  getMustReadBooks,
} from "../utils/contentStore";

const heroImages = DEFAULT_HERO_IMAGES;

const Home = () => {
  const { isLoggedIn, location: userLoc } = useAuth();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [slideIndex, setSlideIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [heroImgIdx, setHeroImgIdx] = useState(0);
  const [heroImgSrcs, setHeroImgSrcs] = useState(null);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [quotesList, setQuotesList] = useState(quotes);
  const [serverListings, setServerListings] = useState([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [catImgMap, setCatImgMap] = useState({});
  const [trendingBooks, setTrendingBooks] = useState(defaultTrending);
  const [mustReadBooks, setMustReadBooks] = useState(defaultMustRead);
  const {
    status: locStatus,
    value: userLocation,
    request: locateMe,
  } = useGeolocation();
  const [payBook, setPayBook] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % heroSlides.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % quotesList.length);
    }, 4000);
    return () => clearInterval(id);
  }, [quotesList.length]);

  useEffect(() => {
    const srcs = heroImgSrcs || DEFAULT_HERO_IMAGES;
    if (!srcs.length) return undefined;
    const id = setInterval(() => {
      setHeroImgIdx((i) => (i + 1) % srcs.length);
    }, 3000);
    return () => clearInterval(id);
  }, [heroImgSrcs?.length]);

  useEffect(() => {
    let alive = true;
    const lat = userLoc?.lat ?? undefined;
    const lng = userLoc?.lng ?? undefined;
    getAllListings(lat, lng)
      .then((l) => alive && setServerListings(l))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userLoc?.lat, userLoc?.lng]);

  useEffect(() => {
    let alive = true;
    getCustomHeroImages()
      .then((imgs) => alive && imgs && setHeroImgSrcs(imgs))
      .catch(() => {});
    getCustomQuotes()
      .then((qs) => alive && qs && setQuotesList(qs))
      .catch(() => {});
    getCategoryImages()
      .then((ci) => alive && ci && setCatImgMap(ci))
      .catch(() => {});
    getTrendingBooks()
      .then((t) => alive && t && setTrendingBooks(t))
      .catch(() => {});
    getMustReadBooks()
      .then((m) => alive && m && setMustReadBooks(m))
      .catch(() => {});
    Promise.all([getCustomHeroImages()])
      .then(() => alive && setHeroLoaded(true))
      .catch(() => alive && setHeroLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const refresh = async () => {
      try {
        const [imgs, qs, ci, trending, mustRead] = await Promise.all([
          getCustomHeroImages(),
          getCustomQuotes(),
          getCategoryImages(),
          getTrendingBooks(),
          getMustReadBooks(),
        ]);
        setHeroImgSrcs(imgs || DEFAULT_HERO_IMAGES);
        setQuotesList(qs || quotes);
        setCatImgMap(ci || {});
        setTrendingBooks(trending || defaultTrending);
        setMustReadBooks(mustRead || defaultMustRead);
        setHeroImgIdx(0);
        setQuoteIndex(0);
        setHeroLoaded(true);
      } catch {}
    };
    refresh();
    window.addEventListener(CONTENT_EVENT, refresh);
    return () => window.removeEventListener(CONTENT_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (isLoggedIn && userLoc && routeLocation.state?.scrollTo === "featured") {
      setTimeout(() => {
        document
          .getElementById("featured")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      navigate(routeLocation.pathname, { replace: true, state: null });
    }
  }, [isLoggedIn, userLoc]);

  const scrollToFeatured = () =>
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });

  const handleBrowse = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    scrollToFeatured();
  };

  const runSearch = () => setSubmitted(query.trim());
  const clearSearch = () => {
    setQuery("");
    setSubmitted("");
  };

  const userListBooks = serverListings.map((l) => ({
    title: l.title,
    price:
      l.listingType === "exchange"
        ? "Free"
        : `₹${l.price ?? 0}`,
    originalPrice:
      l.originalPrice && l.listingType !== "rent" && l.listingType !== "exchange"
        ? `₹${l.originalPrice}`
        : undefined,
    condition: l.condition,
    seller: l.sellerName || l.sellerEmail || "BookSetu Seller",
    sellerEmail: l.sellerEmail || "",
    distance: l.distance != null ? `${l.distance.toFixed(1)} km` : null,
    address: l.location,
    category: l.category,
    contact: l.contact,
    listingType: l.listingType || "single",
    images: l.images || [],
    rentFeePercent: l.rentFeePercent,
    rentDays: l.rentDays,
  }));

  const searchPool = [
    ...userListBooks,
    ...featuredBooks,
    ...trendingBooks.map((b) => ({
      title: b.title,
      price: b.price,
      seller: "Local Seller",
    })),
    ...mustReadBooks.map((b) => ({
      title: b.title,
      price: b.price,
      seller: b.author,
    })),
  ];

  const results = submitted
    ? searchPool
        .filter((b) =>
          b.title.toLowerCase().includes(submitted.toLowerCase()),
        )
        .map((b) => {
          return { ...b };
        })
        .sort((a, b) => {
          const da = a.distance ? parseFloat(a.distance) : Infinity;
          const db = b.distance ? parseFloat(b.distance) : Infinity;
          return da - db;
        })
    : [];

  let displayBooks = featuredBooks;
  if (isLoggedIn && userLoc) {
    displayBooks = userListBooks.length > 0 ? userListBooks : featuredBooks;
  } else if (userListBooks.length > 0) {
    displayBooks = [...userListBooks, ...featuredBooks];
  }

  const allCategoryBooks = [
    ...userListBooks,
    ...featuredBooks.map((b) => ({ ...b, category: "Textbooks" })),
    ...trendingBooks.map((b) => ({
      title: b.title,
      price: b.price,
      originalPrice: b.originalPrice || "₹300",
      seller: "Local Seller",
      distance: `${(0.8 + b.rank * 0.7).toFixed(1)} km`,
      condition: "Good",
      category: TRENDING_CATEGORY_MAP[b.tag] || "Textbooks",
    })),
    ...mustReadBooks.map((b) => ({
      title: b.title,
      price: b.price,
      originalPrice: "₹299",
      seller: b.author,
      distance: `${(1.1 + parseFloat(b.rating) * 0.4).toFixed(1)} km`,
      condition: "Like New",
      category: "Motivational",
    })),
    ...EXTRA_CATEGORY_BOOKS,
  ];

  const categoryResults = activeCategory
    ? allCategoryBooks.filter((b) => b.category === activeCategory)
    : [];

  const displayCategories = categories.map((cat) => {
    const custom = catImgMap[cat.name];
    if (custom && custom.length > 0) {
      return { ...cat, slides: custom };
    }
    return cat;
  });

  const effectiveHero = heroImgSrcs || DEFAULT_HERO_IMAGES;

  return (
    <div>
      <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-[28px] md:py-[44px] grid md:grid-cols-[1fr_1.15fr] gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-5 md:mb-6 leading-tight">
              Buy Sell Exchange & Rent Your Books
              <br />
              <span className="text-yellow-300">Near You</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-emerald-100 mb-6 md:mb-8 max-w-xl">
              Find affordable textbooks, novels, and study materials from
              sellers in your neighborhood. Save money, share knowledge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/listing"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-8 py-3.5 rounded-xl font-bold hover:bg-yellow-300 hover:text-emerald-900 transition-all shadow-lg"
              >
                <BookOpen className="w-5 h-5" /> Sell Your Books
              </a>
              <button
                type="button"
                onClick={handleBrowse}
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-bold border border-white/30 hover:bg-white/20 transition-all"
              >
                <Search className="w-5 h-5" /> Browse Books
              </button>
            </div>
            <div className="mt-8 pl-4 border-l-2 border-yellow-300/60">
              <div className="grid">
                {quotesList.map((q, i) => (
                  <div
                    key={i}
                    className={`col-start-1 row-start-1 transition-opacity duration-500 ${
                      i === quoteIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <p className="font-script text-2xl text-emerald-50 leading-snug">
                      "{q.text}"
                    </p>
                    <p className="text-sm mt-1 text-emerald-200">— {q.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block relative">
            <div className="relative w-full max-w-xl ml-auto rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
              {!heroLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-800/40">
                  <BookOpen className="w-12 h-12 text-emerald-200/60 animate-pulse" />
                </div>
              ) : (
                effectiveHero.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Featured books ${i + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                      i === heroImgIdx ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))
              )}
              {heroLoaded && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  {effectiveHero.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Show slide ${i + 1}`}
                      onClick={() => setHeroImgIdx(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === heroImgIdx
                          ? "w-5 h-2 bg-white"
                          : "w-2 h-2 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="absolute -top-6 -left-6 w-28 h-28 bg-yellow-300/40 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-emerald-300/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-6 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 min-w-[240px]">
              <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />
              <span
                key={slideIndex}
                className="font-script text-3xl font-bold leading-none text-gradient-amber animate-slide-up"
              >
                {heroSlides[slideIndex]}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pt-10 md:pt-16 pb-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-transparent transition-all duration-300 focus-within:bg-white focus-within:border-emerald-500/60 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.10)]">
          <button
            type="button"
            onClick={runSearch}
            aria-label="Search"
            className="shrink-0 pl-3 pr-1 text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search books by name..."
            className="flex-1 min-w-0 bg-transparent py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="shrink-0 w-7 h-7 rounded-full bg-gray-200/70 hover:bg-gray-300 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden sm:block w-px h-6 bg-gray-200 shrink-0" />
            <button
              type="button"
              onClick={locateMe}
              title={
                locStatus === "granted" && userLocation
                  ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                  : undefined
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 my-1.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
                locStatus === "granted"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <MapPin
                className={`w-4 h-4 ${locStatus === "loading" ? "animate-pulse" : ""}`}
              />
              <span className="hidden md:inline">
                {locStatus === "granted" && userLocation
                  ? `Location On (${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)})`
                  : locStatus === "loading"
                    ? "Detecting..."
                    : locStatus === "denied"
                      ? "Permission Denied — Retry"
                      : locStatus === "unsupported"
                        ? "Not Supported"
                        : "Use My Location"}
              </span>
              <span className="md:hidden">
                {locStatus === "granted"
                  ? "On"
                  : locStatus === "loading"
                    ? "..."
                    : locStatus === "denied"
                      ? "Retry"
                      : "Locate"}
              </span>
            </button>
        </div>

        {submitted && (
          <div className="mt-8">
            {results.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  No books found for "
                  <span className="font-semibold text-gray-700">{submitted}</span>
                  "
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different title or spelling
                </p>
              </div>
            ) : (
              <>
                <p className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {locStatus === "granted"
                    ? `${results.length} books found — nearest sellers first`
                    : `${results.length} books found`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((book, i) => (
                    <BookCard
                      key={`${book.title}-${i}`}
                      book={book}
                      onClick={() => setPayBook(book)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        </div>

        <div className="text-center mb-12 mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Browse by Category
            </h2>
            <p className="text-gray-500">
              Find books for every subject and class
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8">
            {displayCategories.map((cat) => (
              <CategorySlider
                key={cat.name}
                cat={cat}
                isActive={activeCategory === cat.name}
                onSelect={() =>
                  setActiveCategory(
                    activeCategory === cat.name ? null : cat.name,
                  )
                }
              />
            ))}
          </div>

          {activeCategory && (
            <div className="mt-12">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                  {activeCategory} Books
                  <span className="text-sm font-medium text-gray-400 ml-2">
                    ({categoryResults.length} found)
                  </span>
                </h3>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
              {categoryResults.length === 0 ? (
                <p className="text-center text-gray-500">
                  No books in this category yet
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryResults.map((book, i) => (
                    <BookCard
                      key={`${book.title}-${i}`}
                      book={book}
                      onClick={() => setPayBook(book)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="featured" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Featured Books Near You
          </h2>
          <p className="text-gray-500 flex items-center justify-center gap-1">
            <MapPin className="w-4 h-4" />
            {isLoggedIn && userLoc
              ? `Books near you — ${userLoc.address}`
              : "Showing books from your area"}
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline mt-3"
          >
            View All <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBooks.map((book, i) => (
            <BookCard
              key={i}
              book={book}
              onContact={() => setPayBook(book)}
            />
          ))}
        </div>
      </section>

      <section className="bg-white py-10 md:py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              Trending Books
              <Flame className="w-7 h-7 text-orange-500" />
            </h2>
            <p className="text-gray-500">
              Most viewed books this week near you
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:underline mt-3"
            >
              View All <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
            {trendingBooks.map((book) => (
              <div
                key={book.rank}
                className="relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-3 sm:p-5 hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden group"
              >
                <span className="absolute -top-1 right-3 text-4xl sm:text-6xl font-extrabold text-orange-100 group-hover:text-orange-200 transition-colors select-none">
                  {book.rank}
                </span>
                <div className="relative">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 sm:mb-8">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {book.tag}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-2 mb-2 sm:mb-3 leading-snug text-sm sm:text-base">
                    {book.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-extrabold text-emerald-600">
                      {book.price}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {book.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
            Must Read in Life
            <BookMarked className="w-7 h-7 text-purple-500" />
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Timeless books everyone should read at least once
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {mustReadBooks.map((book, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-4 sm:p-6 hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                <BookMarked className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-bold text-gray-900 leading-snug text-sm sm:text-base">
                {book.title}
              </h3>
              <p className="text-sm text-purple-600 font-medium mt-0.5">
                by {book.author}
              </p>
              <p className="text-xs text-gray-500 mt-2 italic">"{book.note}"</p>
              <div className="flex items-center gap-1 mt-3">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-gray-800">
                  {book.rating}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-100">
                <span className="text-xl font-extrabold text-emerald-600">
                  {book.price}
                </span>
                <button className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors">
                  Grab Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Three simple steps to buy or sell books on BookSetu
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Find Books</h3>
            <p className="text-gray-500">
              Browse thousands of used books near you. Filter by subject, class,
              and condition.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Connect & Buy
            </h3>
            <p className="text-gray-500">
              Connect with nearby sellers. Negotiate fair prices and buy books
              directly.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Track & Receive
            </h3>
            <p className="text-gray-500">
              Track your booking in real-time. Meet sellers nearby or get
              doorstep delivery.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-emerald-600 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Start Selling Your Books Today
          </h2>
          <p className="text-emerald-100 mb-8 max-w-lg mx-auto">
            List your books in minutes. Reach thousands of students and readers
            in your area.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 px-8 py-3.5 rounded-xl font-bold hover:bg-yellow-300 transition-all shadow-lg"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-white font-bold text-xl mb-3">
                <BookOpen className="w-6 h-6 text-emerald-400" /> BookSetu
              </div>
              <p className="text-sm">
                Your trusted marketplace for buying and selling used books.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/listing"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Sell Books
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Categories</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Textbooks
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Fiction
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Academic
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Safety Tips
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            &copy; 2026 BookSetu. All rights reserved.
          </div>
        </div>
      </footer>

      {payBook && (
        <ContactModal book={payBook} onClose={() => setPayBook(null)} />
      )}

      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-8 text-center relative animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLoginPrompt(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-emerald-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900">Login First</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              Login to see books from nearby sellers — once logged in, featured
              section will show books near you instantly.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowLoginPrompt(false);
                navigate("/login", { state: { scrollTo: "featured" } });
              }}
              className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/30"
            >
              Login Now
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLoginPrompt(false);
                navigate("/signup", { state: { scrollTo: "featured" } });
              }}
              className="w-full mt-3 py-3 rounded-xl font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              Create New Account
            </button>

            <p className="mt-4 text-xs text-gray-400">
              Nearby books are available for logged-in users only
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
