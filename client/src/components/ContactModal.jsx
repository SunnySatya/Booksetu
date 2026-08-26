import React, { useEffect, useRef, useState } from "react";
import { X, Send, MapPin, MessageCircle, Phone, Tag, Check, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import useChat from "../hooks/useChat";
import { addNotification } from "../utils/notificationStore";
import { makeConvId, sendMessage, setOfferStatus, deleteConversationByKey } from "../utils/chatStore";

function ContactModal({ book, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const convId = makeConvId(book);
  const messages = useChat(convId);

  const autoRole =
    user?.email && book.sellerEmail && user.email === book.sellerEmail
      ? "seller"
      : "buyer";
  const [role, setRole] = useState(autoRole);

  const [draft, setDraft] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [viewer, setViewer] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sellerPhone = book?.contact?.phone || "+91 98765 43210";
  const waNumber = book?.contact?.whatsapp || (book?.contact?.phone ? book.contact.phone : null);

  const push = (msg) =>
    sendMessage(convId, msg, { bookTitle: book.title, seller: book.seller });

  const sendText = () => {
    if (!draft.trim()) return;
    push({ from: role, type: "text", text: draft.trim() });
    setDraft("");
    inputRef.current?.focus();
  };

  const sendOffer = () => {
    const price = parseInt(String(offerPrice).replace(/\D/g, ""), 10);
    if (!Number.isFinite(price) || price <= 0) {
      toast("Enter a valid price", "error");
      return;
    }
    push({ from: role, type: "offer", price, status: "pending" });
    setOfferPrice("");
    setOfferMode(false);
    toast(`₹${price} offer sent`);
    if (role === "seller") {
      addNotification({
        kind: "offer",
        title: `Price Offer: ₹${price}`,
        body: `"${book.title}" — seller made an offer — accept/decline`,
      }).catch(() => {});
    } else {
      addNotification({
        kind: "offer",
        title: `Naya Buyer Offer: ₹${price}`,
        body: `"${book.title}" — buyer made an offer`,
      }).catch(() => {});
    }
  };

  const respondOffer = (msg, status) => {
    setOfferStatus(convId, msg.id, status).catch(() => {});
    if (status === "accepted") {
      toast(`Deal! Fixed at ₹${msg.price}`);
      addNotification({
        kind: "deal",
        title: `Deal Fix: ₹${msg.price}`,
        body: `"${book.title}" — offer accepted, plan pickup with seller`,
      }).catch(() => {});
    } else {
      toast("Offer declined", "info");
      addNotification({
        kind: "info",
        title: "Offer Declined",
        body: `"${book.title}" — offer declined, continue negotiation`,
      }).catch(() => {});
    }
  };

  const handleDeleteChat = async () => {
    if (!window.confirm("Delete this chat? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteConversationByKey(convId);
      toast("Chat deleted");
      onClose();
    } catch {
      toast("Failed to delete chat", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{book.title}</h3>
            <p className="text-xs text-gray-500 truncate">
              Seller: {book.seller}
              {book.price ? ` • Asking ${book.price}` : ""}
            </p>
          </div>
          <button
            onClick={handleDeleteChat}
            disabled={deleting}
            aria-label="Delete chat"
            className="shrink-0 w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 ml-1 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 border-b border-gray-50 shrink-0">
          <a
            href={`tel:${sellerPhone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
          {waNumber && (
            <a
              href={`https://wa.me/91${waNumber}?text=${encodeURIComponent(`Hi! I'm interested in "${book.title}" listed on BookSetu.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
          {book.address && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 truncate max-w-[140px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {book.address}
            </span>
          )}
        </div>

        {book.images && book.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-3 border-b border-gray-50 shrink-0">
            {book.images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setViewer(src)}
                aria-label={`View photo ${i + 1}`}
                className="shrink-0 rounded-xl overflow-hidden ring-1 ring-gray-200 hover:ring-emerald-400 transition-all"
              >
                <img src={src} alt={`Photo ${i + 1}`} className="w-16 h-16 object-cover" />
              </button>
            ))}
          </div>
        )}

        <div ref={listRef} className="flex-1 min-h-[180px] h-52 sm:h-60 overflow-y-auto bg-gray-50 px-4 py-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-xs text-gray-400 pt-8">
              Start a conversation — discuss price or make an offer
            </p>
          )}
          {messages.map((msg) => {
            const mine = msg.from === role;
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    msg.type === "offer"
                      ? "bg-amber-50 ring-1 ring-amber-200"
                      : mine
                        ? "bg-emerald-600 text-white rounded-br-md"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {msg.type === "offer" ? (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 mb-0.5">
                        Price Offer — {msg.from === "buyer" ? "Buyer" : "Seller"}
                      </p>
                      <p className="font-extrabold text-gray-900 text-lg leading-none">₹{msg.price}</p>
                      {msg.status === "pending" ? (
                        !mine ? (
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => respondOffer(msg, "accepted")}
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => respondOffer(msg, "declined")}
                              className="flex-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-600 mt-1 font-medium">Waiting for reply...</p>
                        )
                      ) : (
                        <p
                          className={`text-[11px] mt-1 font-semibold ${
                            msg.status === "accepted" ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {msg.status === "accepted" ? "✓ Accepted" : "✕ Declined"}
                        </p>
                      )}
                    </div>
                  ) : (
                    msg.text
                  )}
                  <p className={`text-[10px] mt-1 text-right ${mine && msg.type !== "offer" ? "text-emerald-100" : "text-gray-400"}`}>
                    {new Date(msg.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {offerMode && (
          <div className="px-4 pt-2 shrink-0">
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendOffer()}
                placeholder="Final price ₹"
                autoFocus
                className="flex-1 min-w-0 px-3 py-2 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              />
              <button
                type="button"
                onClick={sendOffer}
                className="bg-amber-500 text-white px-4 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}

        <div className="p-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
              role === "seller" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
            }`}>
              {role} view
            </span>
            {role === "seller" && (
              <button
                type="button"
                onClick={() => setOfferMode((v) => !v)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                  offerMode ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> Price Offer
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Type a message..."
              className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <button
              onClick={sendText}
              aria-label="Send message"
              className="bg-emerald-600 text-white px-4 rounded-xl hover:bg-emerald-700 transition-colors shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {viewer && (
      <div
        className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setViewer(null)}
      >
        <button
          type="button"
          aria-label="Close photo"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={viewer}
          alt="Book photo"
          className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
}

export default ContactModal;
