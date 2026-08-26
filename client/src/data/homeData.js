export const parsePrice = (p) => parseInt(String(p).replace(/[^0-9]/g, "")) || 0;

export const quotes = [
  {
    text: "A room without books is like a body without a soul.",
    author: "Marcus Tullius Cicero",
  },
  { text: "So many books, so little time.", author: "Frank Zappa" },
  {
    text: "A reader lives a thousand lives before he dies.",
    author: "George R.R. Martin",
  },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
];

const categoryImages = import.meta.glob("../assets/categories/*.svg", {
  eager: true,
  import: "default",
});

export const categories = [
  "Textbooks",
  "Competitive",
  "Stories",
  "Novels",
  "Motivational",
].map((name) => ({
  name,
  slides: [1, 2, 3, 4].map(
    (n) => categoryImages[`../assets/categories/${name.toLowerCase()}-${n}.svg`]
  ),
}));

export const featuredBooks = [
  {
    title: "NCERT Physics Class 12",
    price: "₹120",
    condition: "Good",
    seller: "Rahul M.",
    distance: "2.3 km",
    originalPrice: "₹450",
  },
  {
    title: "Organic Chemistry",
    price: "₹80",
    condition: "Like New",
    seller: "Priya S.",
    distance: "1.5 km",
    originalPrice: "₹350",
  },
  {
    title: "Modern History of India",
    price: "₹60",
    condition: "Fair",
    seller: "Amit K.",
    distance: "3.1 km",
    originalPrice: "₹280",
  },
  {
    title: "Mathematics Class 10",
    price: "₹90",
    condition: "Good",
    seller: "Sneha R.",
    distance: "0.8 km",
    originalPrice: "₹320",
  },
  {
    title: "English Grammar Guide",
    price: "₹50",
    condition: "Good",
    seller: "Vikram P.",
    distance: "4.2 km",
    originalPrice: "₹250",
  },
  {
    title: "Data Structures (C++)",
    price: "₹150",
    condition: "Like New",
    seller: "Neha G.",
    distance: "1.9 km",
    originalPrice: "₹500",
  },
];

export const heroSlides = [
  "Book on Rent",
  "Sell up to 45% Off",
  "Buy up to 70% Off",
  "Sell to Needy",
  "Don't Sell in Scrap",
];

export const trendingBooks = [
  { rank: 1, title: "Atomic Habits", price: "₹180", views: "1.2k", tag: "Self-Help" },
  { rank: 2, title: "HC Verma Physics", price: "₹220", views: "980", tag: "Academic" },
  { rank: 3, title: "The Alchemist", price: "₹110", views: "870", tag: "Fiction" },
  { rank: 4, title: "RD Sharma Maths", price: "₹140", views: "760", tag: "Academic" },
  { rank: 5, title: "Rich Dad Poor Dad", price: "₹160", views: "690", tag: "Finance" },
];

export const mustReadBooks = [
  { title: "Wings of Fire", author: "A.P.J. Abdul Kalam", note: "Inspiring journey of a legend", rating: "4.9", price: "₹150" },
  { title: "Ikigai", author: "Hector Garcia", note: "Find your purpose in life", rating: "4.7", price: "₹190" },
  { title: "Think and Grow Rich", author: "Napoleon Hill", note: "Classic on wealth mindset", rating: "4.6", price: "₹130" },
  { title: "The Power of Now", author: "Eckhart Tolle", note: "Live in the present moment", rating: "4.6", price: "₹170" },
  { title: "Monk Who Sold His Ferrari", author: "Robin Sharma", note: "Lessons on a meaningful life", rating: "4.5", price: "₹145" },
];

export const TRENDING_CATEGORY_MAP = {
  "Self-Help": "Motivational",
  Academic: "Textbooks",
  Fiction: "Novels",
  Finance: "Motivational",
};

export const EXTRA_CATEGORY_BOOKS = [
  {
    title: "Malgudi Days",
    price: "₹95",
    originalPrice: "₹250",
    condition: "Good",
    seller: "Kiran M.",
    distance: "1.4 km",
    category: "Stories",
  },
  {
    title: "Panchatantra Tales",
    price: "₹70",
    originalPrice: "₹180",
    condition: "Fair",
    seller: "Deepa S.",
    distance: "2.1 km",
    category: "Stories",
  },
  {
    title: "Godan",
    price: "₹120",
    originalPrice: "₹300",
    condition: "Like New",
    seller: "Manoj V.",
    distance: "0.9 km",
    category: "Stories",
  },
  {
    title: "The Guide",
    price: "₹110",
    originalPrice: "₹260",
    condition: "Good",
    seller: "Farah K.",
    distance: "3.3 km",
    category: "Novels",
  },
  {
    title: "Train to Pakistan",
    price: "₹105",
    originalPrice: "₹240",
    condition: "Fair",
    seller: "Suresh N.",
    distance: "2.8 km",
    category: "Novels",
  },
  {
    title: "UPSC Prelims PYQ Book",
    price: "₹210",
    originalPrice: "₹550",
    condition: "Like New",
    seller: "Aditi R.",
    distance: "1.1 km",
    category: "Competitive",
  },
  {
    title: "SSC CGL Complete Guide",
    price: "₹180",
    originalPrice: "₹480",
    condition: "Good",
    seller: "Rohit B.",
    distance: "1.7 km",
    category: "Competitive",
  },
];

export const NEAR_POOL = [
  { title: "NCERT Science Class 10", op: 340 },
  { title: "HC Verma Concepts of Physics", op: 450 },
  { title: "RD Sharma Mathematics", op: 380 },
  { title: "Wren & Martin English Grammar", op: 290 },
  { title: "Indian History - Lucent", op: 320 },
  { title: "Oswaal Sample Papers", op: 260 },
];

export const SELLER_OFFSETS = [
  { lat: 0.008, lng: 0.004 },
  { lat: -0.012, lng: 0.009 },
  { lat: 0.015, lng: -0.011 },
  { lat: -0.006, lng: -0.016 },
  { lat: 0.021, lng: 0.018 },
  { lat: -0.019, lng: 0.007 },
  { lat: 0.005, lng: 0.024 },
  { lat: -0.009, lng: -0.013 },
];
