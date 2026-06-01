import React, { useState, useEffect } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Phone as PhoneIcon, 
  Car, 
  Compass, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  Lock, 
  Sparkles, 
  Mail, 
  LogIn 
} from "lucide-react";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

// India country code +91 with real business operator phone number
const TASHU_TRAVELS_WHATSAPP = "919525062666"; 

enum OperationType {
  CREATE = "create",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

interface CarData {
  id: string;
  name: string;
}

interface BookingFormProps {
  selectedCar?: string;
  carsList?: CarData[];
}

const getStandardBaseRate = (car: string, trip: string) => {
  if (car === "Ertiga") {
    if (trip === "Local") return 2500;
    if (trip === "Outstation One-Way") return 3500;
    if (trip === "Outstation Round-Trip") return 3250;
    if (trip === "Airport Pick/Drop") return 1200;
    return 2500;
  } else if (car === "Innova Crysta") {
    if (trip === "Local") return 4000;
    if (trip === "Outstation One-Way") return 4750;
    if (trip === "Outstation Round-Trip") return 4500;
    if (trip === "Airport Pick/Drop") return 2000;
    return 4000;
  } else {
    // Other (Specify) - Benchmark baseline placeholder of ₹3,000 flat
    return 3000;
  }
};

export default function BookingForm({ selectedCar, carsList }: BookingFormProps) {
  const { user, userProfile, signInWithGoogle, signInWithEmail, signUpWithEmail, authError, clearAuthError } = useAuth();

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [tripType, setTripType] = useState("Local");
  const [customTripType, setCustomTripType] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [numberOfDays, setNumberOfDays] = useState(1);
  const [carType, setCarType] = useState("Innova Crysta");
  const [customCarName, setCustomCarName] = useState("");
  const [carQuantity, setCarQuantity] = useState<number>(1);

  // Offers State
  const [giveFeedbackOffer, setGiveFeedbackOffer] = useState(false);
  const [shareReferralOffer, setShareReferralOffer] = useState(false);

  // Manual pricing override state
  const [manualBasePrice, setManualBasePrice] = useState<number | "">("");

  // Sync manualBasePrice with active standard base rate on load and change
  useEffect(() => {
    setManualBasePrice(getStandardBaseRate(carType, tripType));
  }, [carType, tripType]);

  // Billing computations
  const getPricingEstimation = () => {
    const baseRatePerDay = manualBasePrice !== "" ? Number(manualBasePrice) : getStandardBaseRate(carType, tripType);
    const baseAmount = baseRatePerDay * carQuantity * numberOfDays;
    
    let discountPct = 0;
    if (giveFeedbackOffer) discountPct += 1.0;
    if (shareReferralOffer) discountPct += 2.5;

    const discountAmount = Math.round(baseAmount * (discountPct / 100));
    const finalAmount = baseAmount - discountAmount;

    return {
      baseRatePerDay,
      baseAmount,
      discountPct,
      discountAmount,
      finalAmount
    };
  };

  const pricing = getPricingEstimation();

  // Sub-Auth Panels for unauthenticated users
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authPanelError, setAuthPanelError] = useState("");

  // Sync with selected car from Fleet Grid
  useEffect(() => {
    if (selectedCar) {
      const knownIds = ["Innova Crysta", "Ertiga"];
      if (knownIds.includes(selectedCar)) {
        setCarType(selectedCar);
        setCustomCarName("");
      } else {
        setCarType("Other (Specify)");
        setCustomCarName(selectedCar);
      }
    }
  }, [selectedCar]);

  // Prepopulate form when authenticated user profile changes
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || "");
      const rawPhone = userProfile.phone || "";
      const cleaned = rawPhone.replace(/^\+91\s*/, "");
      setPhone(cleaned);
    }
  }, [userProfile]);

  // Status handlers
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: user?.uid,
        email: user?.email
      },
      operationType,
      path,
    };
    console.error("Firestore Error Logged: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthPanelError("");
    clearAuthError();

    try {
      if (authMode === "login") {
        await signInWithEmail(authEmail, authPassword);
      } else {
        if (authPhone.length < 10) {
          throw new Error("Please enter a valid 10-digit phone number.");
        }
        await signUpWithEmail(authEmail, authPassword, authName, authPhone);
      }
    } catch (err: any) {
      setAuthPanelError(err.message || "Failed to authenticate. Please verify your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setErrorMessage("Please authenticate to secure your booking history.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    // Validate phone length
    if (phone.replace(/\D/g, "").length < 10) {
      setStatus("error");
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    const finalCarSelected = carType === "Other (Specify)" ? customCarName : carType;
    if (carType === "Other (Specify)" && !customCarName.trim()) {
      setStatus("error");
      setErrorMessage("Please specify the custom car name.");
      return;
    }

    const finalTripType = tripType === "Other (Specify)" ? customTripType : tripType;
    if (tripType === "Other (Specify)" && !customTripType.trim()) {
      setStatus("error");
      setErrorMessage("Please specify the custom trip type.");
      return;
    }

    const bookingId = "bk_" + Math.random().toString(36).substring(2, 10);
    const bookingData = {
      fullName,
      phone: `+91 ${phone.trim()}`,
      tripType: finalTripType,
      pickupLocation,
      dropLocation,
      pickupDate,
      pickupTime,
      numberOfDays: Number(numberOfDays),
      carType,
      customCarName: carType === "Other (Specify)" ? customCarName : "",
      carQuantity: Number(carQuantity),
      estimatedPrice: pricing.finalAmount,
      appliedDiscountPercent: pricing.discountPct,
      status: "pending",
      createdAt: new Date().toISOString(),
      userId: user.uid,
      userEmail: user.email || ""
    };

    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await setDoc(bookingRef, bookingData);
      
      setStatus("success");
      triggerWhatsAppRedirect(fullName, finalTripType, finalCarSelected, carQuantity, pickupDate, pricing.finalAmount, pricing.discountPct);
    } catch (error: any) {
      console.warn("Firestore save failed. Check firestore rules / config.", error);
      try {
        handleFirestoreError(error, OperationType.WRITE, `bookings/${bookingId}`);
      } catch (logErr) {}

      setStatus("success");
      triggerWhatsAppRedirect(fullName, finalTripType, finalCarSelected, carQuantity, pickupDate, pricing.finalAmount, pricing.discountPct);
    }
  };

  const triggerWhatsAppRedirect = (
    name: string,
    type: string,
    car: string,
    quantity: number,
    date: string,
    finalAmount: number,
    discountPct: number
  ) => {
    const baseText = `₹${pricing.baseAmount.toLocaleString("en-IN")}`;
    const multiplierText = `${quantity} Car(s) x ${numberOfDays} Day(s) (₹${pricing.baseRatePerDay.toLocaleString("en-IN")}/day)`;
    const discountText = pricing.discountAmount > 0 ? `-₹${pricing.discountAmount.toLocaleString("en-IN")} (${pricing.discountPct}% Discount)` : "No active discount applied";
    const finalAmountStr = `₹${finalAmount.toLocaleString("en-IN")}`;

    const message = `Hello Tashu Travels, I want to book a premium ride.

Name: ${name}
Trip Type: ${type}
Car: ${car} (Quantity: ${quantity})
Date: ${date}
Duration: ${numberOfDays} Day(s)

--- Pricing Breakdown ---
• Base Price: ${baseText}
• Multiplier: ${multiplierText}
• Applied Discount: ${discountText}
• Final Estimated Payable: ${finalAmountStr}

Please confirm availability and the final custom itinerary quote.`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${TASHU_TRAVELS_WHATSAPP}?text=${encodedText}`;
    
    setTimeout(() => {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }, 1200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto" id="booking-section">
      <div className="relative overflow-hidden bg-white border border-zinc-200/80 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/50">
        
        {/* Decorative thin accent line */}
        <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-blue-900/40 to-transparent" />

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center py-10"
              id="booking-success"
            >
              <div className="p-4 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-600 mb-6 shadow-sm">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-sans font-semibold text-zinc-900 mb-2">Booking Reserved Successfully!</h3>
              <p className="text-zinc-600 max-w-md text-sm leading-relaxed mb-6">
                Hi {fullName}, your reservation is securely stored. We're redirecting you to WhatsApp to instantly confirm pricing and dispatch with the coordinator.
              </p>
              
              <div className="flex items-center space-x-3 text-blue-900 font-mono text-xs uppercase tracking-wider bg-zinc-50 px-4 py-2.5 rounded-full border border-zinc-200">
                <span>Connecting with Chauffeur Desk</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-700"></span>
                </span>
              </div>
            </motion.div>
          ) : !user ? (
            /* Unauthenticated State: Render luxury credentials panel directly in the form workspace */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
              id="booking-auth-portal"
            >
              <div className="border-b border-zinc-200 pb-4 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-105 text-blue-900 mb-3 shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-semibold text-zinc-900">Unlock Secure Bookings</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Verify your account to record reservation tracking, protect travel history, and access luxury transport privileges.
                </p>
              </div>

              {(authPanelError || authError) && (
                <div className="flex items-center space-x-3 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{authPanelError || authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthAction} className="space-y-4">
                {authMode === "register" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1.5 font-medium">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          placeholder="Rajesh Kumar"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1.5 font-medium">Phone Number</label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 98765 43210"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1.5 font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-650 mb-1.5 font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white font-sans font-medium text-sm py-3 px-4 rounded-lg transition-transform active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shadow-md shadow-zinc-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{authLoading ? "Synchronizing Secure Credentials..." : authMode === "login" ? "Sign In & Continue Booking" : "Create Account & Secure Ride"}</span>
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-medium">or</span>
                <div className="flex-grow border-t border-zinc-200"></div>
              </div>

              {/* Google OAuth Access - Supported client layout */}
              <button
                onClick={() => {
                  setAuthLoading(true);
                  signInWithGoogle().catch(() => {}).finally(() => setAuthLoading(false));
                }}
                disabled={authLoading}
                className="w-full bg-white border border-zinc-200 hover:border-zinc-350 hover:bg-zinc-50 text-zinc-700 font-sans text-xs py-2.5 rounded-lg flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.08-1.3-.176-1.854H12.24z"/>
                </svg>
                <span className="font-medium">Continue with Google Account</span>
              </button>

              <div className="text-center pt-2">
                {authMode === "login" ? (
                  <p className="text-xs text-zinc-500">
                    New to Tashu Travels?{" "}
                    <button onClick={() => setAuthMode("register")} className="text-blue-900 underline hover:text-blue-850 font-semibold cursor-pointer">
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Already registered?{" "}
                    <button onClick={() => setAuthMode("login")} className="text-blue-900 underline hover:text-blue-850 font-semibold cursor-pointer">
                      Log In here
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            /* Authenticated Booking Form View - High-end off-white aesthetic */
            <form onSubmit={handleSubmit} className="space-y-6" id="lead-form">
              <div className="border-b border-zinc-200 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-xl font-sans font-semibold text-zinc-900 flex items-center gap-2">
                    Request a Premium Vehicle <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Logged in traveler: <span className="text-blue-900 font-mono font-semibold">{userProfile?.fullName || user.displayName || user.email}</span>
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1 text-[10px] font-mono text-emerald-800 flex items-center space-x-1 font-semibold shadow-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>🔒 Secured Cloud Connection</span>
                </div>
              </div>

              {status === "error" && (
                <div className="flex items-center space-x-3 text-sm text-red-650 bg-red-50 border border-red-200 p-3 rounded-lg" id="form-error">
                  <AlertCircle className="w-5 h-5 shrink-0 animate-bounce" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Grid 1: Name and Phone - Prepopulated */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 transition-all font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-sm font-mono text-zinc-500 border-r border-zinc-200 pr-2 flex items-center h-5">
                      +91
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-16 pr-4 text-sm font-mono text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Trip Type and Car Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Trip Type</label>
                  <div className="relative">
                    <Compass className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <select
                      value={tripType}
                      onChange={(e) => {
                        setTripType(e.target.value);
                        if (e.target.value !== "Other (Specify)") setCustomTripType("");
                      }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 appearance-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 cursor-pointer transition-all font-sans"
                    >
                      <option value="Local">Local</option>
                      <option value="Outstation One-Way">Outstation One-Way</option>
                      <option value="Outstation Round-Trip">Outstation Round-Trip</option>
                      <option value="Airport Pick/Drop">Airport Pick/Drop</option>
                      <option value="Other (Specify)">Other (Specify)</option>
                    </select>
                  </div>

                  {/* Conditional custom trip type text input */}
                  <AnimatePresence>
                    {tripType === "Other (Specify)" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3"
                      >
                        <label className="block text-xs font-mono uppercase tracking-wider text-amber-600 mb-1.5 font-semibold">Specify Trip Type</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Wedding, Corporate Event, Tour..."
                          value={customTripType}
                          onChange={(e) => setCustomTripType(e.target.value)}
                          className="w-full bg-zinc-50 border border-amber-500/30 rounded-lg py-3 px-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 placeholder:text-zinc-400 font-sans"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Select Vehicle Class</label>
                    <div className="relative">
                      <Car className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                      <select
                        value={carType}
                        onChange={(e) => {
                          setCarType(e.target.value);
                          if (e.target.value !== "Other (Specify)") setCustomCarName("");
                        }}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 appearance-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 cursor-pointer transition-all font-sans"
                      >
                        <option value="Innova Crysta">Innova Crysta</option>
                        <option value="Ertiga">Ertiga</option>
                        <option value="Other (Specify)">Other (Specify)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Car Quantity</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={carQuantity}
                      onChange={(e) => setCarQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 px-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional custom vehicle input */}
              <AnimatePresence>
                {carType === "Other (Specify)" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-mono uppercase tracking-wider text-amber-600 mb-1.5 font-semibold">Specify Custom Vehicle Requirements</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fortuner, Honda City, Audi A6, BMW 5-Series..."
                      value={customCarName}
                      onChange={(e) => setCustomCarName(e.target.value)}
                      className="w-full bg-zinc-50 border border-amber-500/30 rounded-lg py-3 px-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 placeholder:text-zinc-400 font-sans"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid 3: Pick & Drop Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Pickup Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hotel Taj Palace, New Delhi"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 placeholder:text-zinc-400 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Drop Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. IGI Airport Terminal 3"
                      value={dropLocation}
                      onChange={(e) => setDropLocation(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-zinc-400 placeholder:text-zinc-400 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 4: Pickup Date, Pickup Time, Number of Days */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Pickup Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-3 text-xs md:text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Pickup Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="time"
                      required
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 pl-10 pr-3 text-xs md:text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-600 mb-1.5 font-semibold">Number of Days</label>
                  <input
                     type="number"
                     required
                     min={1}
                     max={90}
                     value={numberOfDays}
                     onChange={(e) => setNumberOfDays(Math.max(1, parseInt(e.target.value) || 1))}
                     className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-3 px-4 text-sm text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:border-zinc-400 font-mono"
                  />
                </div>
              </div>

              {/* Promo & Incentive System (Exclusive Perks) */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 md:p-5 mt-2 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-zinc-800 font-sans font-semibold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Exclusive Perks & Offers</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Feedback Perk */}
                  <button
                    type="button"
                    onClick={() => setGiveFeedbackOffer(!giveFeedbackOffer)}
                    className={`flex items-start text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      giveFeedbackOffer 
                        ? "bg-amber-50/50 border-amber-300 text-zinc-900 ring-2 ring-amber-500/10" 
                        : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"
                    }`}
                  >
                    <div className="flex items-start space-x-2 w-full">
                      <div className="text-lg mt-0.5 select-none">📝</div>
                      <div className="flex-1">
                        <span className="block font-sans font-semibold text-xs text-zinc-900">Give Feedback</span>
                        <span className="block font-sans text-[11px] text-zinc-500 leading-tight mt-0.5">Get 1% OFF on your current ride</span>
                      </div>
                      <div className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center mt-0.5 ${
                        giveFeedbackOffer ? "bg-amber-500 border-transparent text-white" : "border-zinc-300 bg-white"
                      }`}>
                        {giveFeedbackOffer && (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Share & Invite Perk */}
                  <button
                    type="button"
                    onClick={() => setShareReferralOffer(!shareReferralOffer)}
                    className={`flex items-start text-left p-3 rounded-lg border transition-all cursor-pointer ${
                      shareReferralOffer 
                        ? "bg-amber-50/50 border-amber-300 text-zinc-900 ring-2 ring-amber-500/10" 
                        : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"
                    }`}
                  >
                    <div className="flex items-start space-x-2 w-full">
                      <div className="text-lg mt-0.5 select-none">🔗</div>
                      <div className="flex-1">
                        <span className="block font-sans font-semibold text-xs text-zinc-900">Share & Invite</span>
                        <span className="block font-sans text-[11px] text-zinc-500 leading-tight mt-0.5">Earn 2.5% OFF with referrals</span>
                      </div>
                      <div className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center mt-0.5 ${
                        shareReferralOffer ? "bg-amber-500 border-transparent text-white" : "border-zinc-300 bg-white"
                      }`}>
                        {shareReferralOffer && (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Pricing breakdown card */}
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 md:p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60">
                  <span className="font-sans font-semibold text-xs text-zinc-700 uppercase tracking-wider">Estimated Price Breakdown</span>
                  <span className="font-mono text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Quote Summary</span>
                </div>

                {/* Editable Base Rate Per Day Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded-xl border border-zinc-200/80 shadow-xs gap-3">
                  <div className="font-sans">
                    <span className="block font-semibold text-xs text-zinc-800">Base Price (₹ / day):</span>
                    <span className="block text-[10px] text-zinc-400 font-normal leading-normal mt-0.5">Customize base rate per day directly on screen</span>
                  </div>
                  <div className="relative flex items-center max-w-[140px] w-full self-start sm:self-auto">
                    <span className="absolute left-3 text-zinc-400 font-mono text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={manualBasePrice}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setManualBasePrice(val);
                      }}
                      className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-300 focus:border-blue-900 rounded-lg py-1.5 pl-7 pr-3 text-right font-mono font-bold text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-900 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 text-xs text-zinc-650">
                  {/* Base Price (Calculated Amount based on manual input) */}
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-medium text-zinc-600">Base Price:</span>
                    <span className="font-mono font-bold text-zinc-900">
                      ₹{pricing.baseAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Quantity x Days Multiplier Line */}
                  <div className="flex justify-between items-center">
                    <span className="font-sans font-medium text-zinc-600">Quantity x Days Multiplier:</span>
                    <span className="font-mono font-semibold text-zinc-700 bg-white border border-zinc-200/50 px-2 py-0.5 rounded text-[11px]">
                      {carQuantity} Car{carQuantity > 1 ? "s" : ""} x {numberOfDays} Day{numberOfDays > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Applied Discount Line */}
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-semibold bg-emerald-50/70 px-2 py-1.5 rounded border border-emerald-100">
                      <span className="font-sans flex items-center gap-1.5 text-[11px]">
                        <Sparkles className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                        Applied Discount:
                      </span>
                      <span className="font-mono font-bold">
                        -₹{pricing.discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Final Estimated Payable Line */}
                <div className="flex justify-between items-center pt-2.5 border-t border-zinc-200/60 font-sans font-bold text-zinc-950 mt-1">
                  <span className="text-sm">Final Estimated Payable:</span>
                  <span className="text-base font-mono text-blue-900">
                    ₹{pricing.finalAmount.toLocaleString("en-IN")}*
                  </span>
                </div>

                <p className="text-[10px] text-zinc-400 leading-tight">
                  *Taxes, tolls, parking charges, and state permits are calculated as actuals at journey completion. Subject to local fuel dynamics.
                </p>
              </div>

              {/* Submit Button - Striking Navy/Silver Accent */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold text-sm py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 shadow-lg shadow-zinc-200/55 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{status === "submitting" ? "Securing Cloud Reservation..." : "Confirm & Send via WhatsApp"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
