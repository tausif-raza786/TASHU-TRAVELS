import React, { useState, useEffect } from "react";
import { collection, query, where, doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Compass, 
  Car, 
  Clock, 
  History, 
  LogOut, 
  Edit3, 
  Check, 
  AlertCircle, 
  Lock, 
  MessageSquare, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Home
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../config/firebase";

// WhatsApp Desk Number for direct links
const TASHU_TRAVELS_WHATSAPP = "919525062666";

interface BookingRecord {
  id: string;
  fullName: string;
  phone: string;
  tripType: string;
  pickupLocation: string;
  dropLocation: string;
  pickupDate: string;
  pickupTime: string;
  numberOfDays: number;
  carType: string;
  customCarName?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export default function UserProfile() {
  const { user, userProfile, logout, updateContactInfo, signInWithGoogle, signInWithEmail, signUpWithEmail, authError, clearAuthError } = useAuth();
  
  // Real-time bookings state
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Local Auth Center states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [localAuthError, setLocalAuthError] = useState("");

  // Sync edits inputs when userProfile updates
  useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.fullName || "");
      setEditPhone(userProfile.phone.replace(/^\+91\s*/, "") || "");
    }
  }, [userProfile]);

  // Handle Auth submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setLocalAuthError("");
    clearAuthError();

    try {
      if (authMode === "login") {
        await signInWithEmail(email, password);
      } else {
        if (regPhone.length < 10) {
          throw new Error("Phone number must contain exactly 10 digits.");
        }
        await signUpWithEmail(email, password, regName, regPhone);
      }
    } catch (err: any) {
      setLocalAuthError(err.message || "Credential verification failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Listen real-time to user's bookings securely matching their personal UID
  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    setBookingsLoading(true);
    setBookingsError("");

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const parsedBookings: BookingRecord[] = [];
      snapshot.forEach((doc) => {
        parsedBookings.push({
          id: doc.id,
          ...doc.data()
        } as BookingRecord);
      });

      // Sort by createdAt descending locally to avoid index errors on immediate load
      parsedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setBookings(parsedBookings);
      setBookingsLoading(false);
    }, (error) => {
      console.warn("Firestore collection hook failed. Utilizing fallback secure rendering.", error);
      setBookingsError("Authentication linked properly, but real-time index setup is pending.");
      setBookingsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle contact update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setProfileSuccessMsg("");
    setBookingsError("");

    if (editPhone.replace(/\D/g, "").length < 10) {
      setBookingsError("Please enter a valid 10-digit mobile number.");
      setEditLoading(false);
      return;
    }

    try {
      await updateContactInfo(editName, `+91 ${editPhone.trim()}`);
      setProfileSuccessMsg("Contact information updated successfully.");
      setIsEditing(false);
    } catch (err: any) {
      setBookingsError(err.message || "Failed to save profile changes.");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4" id="user-profile-center">
      
      {!user ? (
        /* Not logged in: Beautiful premium white luxury auth card */
        <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-xl shadow-zinc-200/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 text-blue-900 mx-auto mb-4 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-semibold text-zinc-900">Traveler Dashboard</h2>
            <p className="text-xs text-zinc-550 mt-1 leading-relaxed">
              Log in to track secure journey timelines, modify contact numbers, communicate directly with drivers, and claim elite membership pricing.
            </p>
          </div>

          {(localAuthError || authError) && (
            <div className="mb-6 flex items-start space-x-3 text-xs text-red-650 bg-red-50 border border-red-150 p-3.5 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localAuthError || authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "register" && (
              <>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1 font-semibold">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1 font-semibold">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-sm font-mono text-zinc-500 pr-2 border-r border-zinc-200">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      maxLength={10}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-16 pr-4 text-sm font-mono text-zinc-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1 font-semibold">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1 font-semibold">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold text-sm py-3 rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <span>{authLoading ? "Verifying Secure Credentials..." : authMode === "login" ? "Sign In to Dashboard" : "Register Credentials"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-zinc-200"></div>
            <span className="flex-shrink mx-3 text-[9px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">or</span>
            <div className="flex-grow border-t border-zinc-200"></div>
          </div>

          <button
            onClick={() => {
              setAuthLoading(true);
              signInWithGoogle().catch(() => {}).finally(() => setAuthLoading(false));
            }}
            disabled={authLoading}
            className="w-full bg-white border border-zinc-200 hover:border-zinc-350 text-zinc-700 font-sans text-xs py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.08-1.3-.176-1.854H12.24z"/>
            </svg>
            <span className="font-semibold">Access with Google Account</span>
          </button>

          <div className="text-center mt-6">
            {authMode === "login" ? (
              <p className="text-xs text-zinc-500">
                Are you a new traveler?{" "}
                <button onClick={() => setAuthMode("register")} className="text-blue-950 underline hover:text-blue-800 font-semibold cursor-pointer">
                  Register Account
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                Already registered?{" "}
                <button onClick={() => setAuthMode("login")} className="text-blue-950 underline hover:text-blue-800 font-semibold cursor-pointer">
                  Login Here
                </button>
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Authenticated: Display beautiful light profile panel + Personal booking history feed */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Account Profile Admin Card */}
          <div className="space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-lg shadow-zinc-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center space-x-4 pb-6 border-b border-zinc-200">
                <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-blue-950 rounded-full flex items-center justify-center text-white font-display font-semibold text-2xl shadow-md">
                  {userProfile?.fullName ? userProfile.fullName[0].toUpperCase() : (user.displayName ? user.displayName[0].toUpperCase() : "U")}
                </div>
                <div>
                  <span className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200/40 text-blue-900 text-[9px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full w-max font-bold">
                    <ShieldCheck className="w-3 h-3 text-blue-700" />
                    <span>Traveler Account</span>
                  </span>
                  <h3 className="text-lg font-display font-semibold text-zinc-900 mt-1 leading-snug">
                    {userProfile?.fullName || user.displayName || "Premium Customer"}
                  </h3>
                </div>
              </div>

              {bookingsError && (
                <div className="mt-4 flex items-center space-x-2 text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingsError}</span>
                </div>
              )}

              {profileSuccessMsg && (
                <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-250/50">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {/* Dynamic Profile edit layout */}
              <div className="mt-6">
                {!isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-widest text-zinc-400 mb-0.5 font-bold">Full Communication Name</span>
                      <p className="text-sm font-semibold text-zinc-900">{userProfile?.fullName || user.displayName || "Not Configured"}</p>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-widest text-zinc-400 mb-0.5 font-bold">Mobile Contact (+91)</span>
                      <p className="text-sm font-mono text-zinc-800 font-semibold">
                        {userProfile?.phone || "No phone added yet"}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[9px] font-mono uppercase tracking-widest text-zinc-400 mb-0.5 font-bold">Sync Email Contact</span>
                      <p className="text-sm font-mono text-zinc-600">{user.email}</p>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditName(userProfile?.fullName || user.displayName || "");
                          setEditPhone(userProfile?.phone.replace(/^\+91\s*/, "") || "");
                          setIsEditing(true);
                        }}
                        className="flex-1 bg-white border border-zinc-200 hover:border-zinc-350 text-zinc-700 font-medium font-sans text-xs py-2 rounded-lg flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={logout}
                        className="px-3 py-2 bg-zinc-50 border border-zinc-200 hover:border-red-500/20 text-zinc-500 hover:text-red-650 rounded-lg text-xs flex items-center justify-center cursor-pointer transition-colors"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5 font-bold">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-900 focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5 font-bold">Mobile Phone</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-sm font-mono text-zinc-500 pr-1.5 border-r border-zinc-200">+91</span>
                        <input
                          type="tel"
                          required
                          value={editPhone}
                          maxLength={10}
                          onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 pl-14 pr-3 text-sm font-mono text-zinc-900 focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setBookingsError("");
                        }}
                        className="flex-1 bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs py-2 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={editLoading}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        {editLoading ? "Saving..." : "Save details"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Columns: Bookings History Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-lg shadow-zinc-200/50">
              
              <div className="flex items-center justify-between pb-4 border-b border-zinc-150 mb-6">
                <div className="flex items-center space-x-2.5">
                  <History className="w-5 h-5 text-zinc-700" />
                  <h3 className="text-lg font-display font-semibold text-zinc-900">Your Booking History</h3>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-full px-3 py-0.5 text-[9px] font-mono text-zinc-650 font-bold">
                  {bookings.length} reservations found
                </div>
              </div>

              {bookingsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
                  <p className="text-xs text-zinc-500">Retrieving secure trip details from cloud database...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-250 rounded-xl bg-zinc-50/40">
                  <Compass className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-zinc-700">No Reservations Found</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Once you request your first premium trip, it will instantly list here in your permanent ledger.
                  </p>
                  <a
                    href="#booking-section-wrapper"
                    className="inline-flex items-center space-x-1.5 mt-5 bg-blue-50 border border-blue-200/50 text-blue-900 hover:bg-blue-900 hover:text-white font-sans text-xs px-4 py-2 rounded-lg transition-all cursor-pointer font-semibold shadow-sm"
                  >
                    <span>Request First Journey</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => {
                    const finalCar = b.carType === "Other (Specify)" ? b.customCarName : b.carType;
                    const formattedDate = new Date(b.pickupDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    });

                    // Premium, elegant badge styles
                    const statusConfig = {
                      pending: { bg: "bg-amber-50 border-amber-200 text-amber-800 font-semibold", label: "Pending Desk Review" },
                      confirmed: { bg: "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold", label: "Chauffeur Confirmed" },
                      cancelled: { bg: "bg-red-50 border-red-200 text-red-800 font-semibold", label: "Cancelled" }
                    };

                    const handleReopenAdminChat = () => {
                      const msg = `Hello Tashu Travels! This is ${b.fullName} regarding my ride reservation (ID: ${b.id}) on ${formattedDate}. Let's confirm final details.`;
                      const whatsappUrl = `https://wa.me/${TASHU_TRAVELS_WHATSAPP}?text=${encodeURIComponent(msg)}`;
                      window.open(whatsappUrl, "_blank");
                    };

                    return (
                      <div 
                        key={b.id} 
                        className="bg-zinc-50/50 border border-zinc-200 rounded-xl p-5 hover:bg-white hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Order {b.id}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${statusConfig[b.status]?.bg || statusConfig.pending.bg}`}>
                              {statusConfig[b.status]?.label || "Pending"}
                            </span>
                          </div>

                          <h4 className="text-md font-sans font-semibold text-zinc-900 flex items-center space-x-2">
                            <Car className="w-4 h-4 text-blue-900" />
                            <span>{finalCar}</span>
                          </h4>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-zinc-600">
                            <div className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400 mr-1.5" />
                              <span className="font-medium text-zinc-700">{formattedDate}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3.5 h-3.5 text-zinc-400 mr-1.5" />
                              <span className="font-mono">{b.pickupTime}</span>
                            </div>
                            <div className="flex items-center col-span-2 sm:col-span-1">
                              <Compass className="w-3.5 h-3.5 text-zinc-400 mr-1.5" />
                              <span className="font-medium text-zinc-700">{b.tripType} ({b.numberOfDays} {b.numberOfDays === 1 ? 'Day' : 'Days'})</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-zinc-500 space-y-0.5 pt-1 border-t border-zinc-100 mt-1">
                            <p className="flex items-start">
                              <MapPin className="w-3 h-3 text-emerald-600 mr-1 mt-0.5 shrink-0" />
                              <span className="truncate">Pickup: {b.pickupLocation}</span>
                            </p>
                            <p className="flex items-start">
                              <MapPin className="w-3 h-3 text-red-650 mr-1 mt-0.5 shrink-0" />
                              <span className="truncate flex-1">Drop: {b.dropLocation}</span>
                            </p>
                          </div>
                        </div>

                        {/* Re-sync order via direct WhatsApp link */}
                        <div className="shrink-0 flex items-center pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200/60">
                          <button
                            onClick={handleReopenAdminChat}
                            className="w-full md:w-auto bg-slate-900 hover:bg-blue-900 hover:text-white text-white text-xs px-4 py-2 rounded-lg border border-transparent transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm font-semibold"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-white" />
                            <span>Desk Chat</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
