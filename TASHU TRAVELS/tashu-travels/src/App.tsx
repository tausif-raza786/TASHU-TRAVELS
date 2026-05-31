import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Phone, 
  MapPin, 
  CheckCircle, 
  Star, 
  ShieldCheck, 
  Award, 
  Users, 
  Briefcase, 
  Wind, 
  Menu, 
  X, 
  Send, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Sparkles,
  User as UserIcon,
  Home
} from "lucide-react";
import BookingForm from "./components/BookingForm";
import UserProfile from "./components/UserProfile";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { db } from "./config/firebase";

interface CarData {
  id: string;
  name: string;
  category: string;
  image: string;
  seats: number;
  bags: number;
  features: string[];
  isAvailable: boolean;
}

// Reliable business services
const BUSINESS_SERVICES = [
  {
    title: "Outstation Trips",
    desc: "Seamless inter-city rides, perfect for family getaways or business visits across North India."
  },
  {
    title: "Airport Transfers",
    desc: "Punctual, round-the-clock pickups and drop-offs to IGI Airport & state main terminals."
  },
  {
    title: "Local Hourly Rental",
    desc: "Hire a car with an expert driver by the hour for local errands, meetings, or custom routes."
  },
  {
    title: "Weddings & VIP Events",
    desc: "Elegant and reliable arrivals. Provide premium luxury cars to delight your family and guests."
  },
  {
    title: "Government & Corp Duty",
    desc: "Professional services prepared for official government visits and standard commercial needs."
  }
];

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, userProfile } = useAuth();
  const [selectedCar, setSelectedCar] = useState<string>("Innova Crysta");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<"home" | "profile">("home");
  const [fleetCars, setFleetCars] = useState<CarData[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);

  // Fallback / Auto-Seed fleet cars if database is completely empty during load
  const SEED_FLEET_CARS: CarData[] = [
    {
      id: "Innova Crysta",
      name: "Toyota Innova Crysta",
      category: "Premium MPV / Tourer",
      image: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Toyota_Innova_Crysta_2.4_V_%28GGN155%29_front_view%2C_Kuala_Lumpur.jpg",
      seats: 7,
      bags: 3,
      features: ["Plush Captain Seats", "Supreme Highway Stability", "Ideal for Families & Executives", "Multi-Zone Auto AC"],
      isAvailable: true
    },
    {
      id: "Ertiga",
      name: "Maruti Suzuki Ertiga",
      category: "Spacious Economy MUV",
      image: "https://upload.wikimedia.org/wikipedia/commons/d/de/2019_Suzuki_Ertiga_GL_1.5_front_view_%28Indonesia%29.jpg",
      seats: 7,
      bags: 2,
      features: ["Smart Hybrid Tech", "Ergonomic Layout", "Excellent City & Highway Maneuverability", "Dual-Zone AC"],
      isAvailable: true
    }
  ];

  // Dynamic Listen to cars collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "cars"), async (snapshot) => {
      const list: CarData[] = [];
      snapshot.forEach((docSnap) => {
        const carData = docSnap.data();
        if (docSnap.id === "Innova Crysta" || docSnap.id === "Ertiga") {
          list.push({ id: docSnap.id, ...carData } as CarData);
        }
      });

      if (list.length === 0) {
        // Run automatic seeding in background if brand new firestore
        try {
          for (const car of SEED_FLEET_CARS) {
            await setDoc(doc(db, "cars", car.id), {
              id: car.id,
              name: car.name,
              category: car.category,
              image: car.image,
              seats: car.seats,
              bags: car.bags,
              features: car.features,
              isAvailable: car.isAvailable
            });
          }
        } catch (err) {
          console.error("Auto seeding of cars failed: ", err);
          setFleetCars(SEED_FLEET_CARS);
          setCarsLoading(false);
        }
      } else {
        setFleetCars(list);
        setCarsLoading(false);
      }
    }, (error) => {
      console.warn("Unable to listen to cars collection, utilizing local backup list.", error);
      setFleetCars(SEED_FLEET_CARS);
      setCarsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGeneralWhatsApp = () => {
    const text = encodeURIComponent("Hello Tashu Travels! I am interested in booking a premium ride. Please assist me with quotes.");
    window.open(`https://wa.me/919525062666?text=${text}`, "_blank");
  };

  const handleSelectCarForBooking = (carId: string) => {
    setSelectedCar(carId);
    setActiveView("home");
    // Expand to booking block
    setTimeout(() => {
      const element = document.getElementById("booking-section-wrapper");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 120);
  };

  const handleNavClick = (sectionId: string) => {
    setActiveView("home");
    setMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const getFirstName = () => {
    if (userProfile?.fullName) return userProfile.fullName.split(" ")[0];
    if (user?.displayName) return user.displayName.split(" ")[0];
    return "Traveler";
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-blue-900 selection:text-white">
      
      {/* 1. Frosted Navigation Header - High-end white design */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-zinc-200/80 shadow-sm" id="main-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Elegant Navy-Gold Logo Branding */}
          <button 
            onClick={() => { setActiveView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center space-x-3 text-left focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center border border-zinc-300">
              <span className="text-white font-display font-bold text-xl">T</span>
            </div>
            <div>
              <span className="text-lg font-display font-bold tracking-wider text-slate-900 block">TASHU TRAVELS</span>
              <span className="block text-[9px] font-mono tracking-widest text-blue-900 uppercase font-semibold -mt-1">Premium Chauffeur Duty</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => { setActiveView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`text-sm font-semibold transition-colors cursor-pointer ${activeView === "home" ? "text-blue-900" : "text-zinc-650 hover:text-blue-900"}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavClick("fleet")} 
              className="text-sm font-semibold text-zinc-650 hover:text-blue-900 transition-colors cursor-pointer"
            >
              Our Fleet
            </button>
            <button 
              onClick={() => handleNavClick("about")} 
              className="text-sm font-semibold text-zinc-650 hover:text-blue-900 transition-colors cursor-pointer"
            >
              Why Tashu
            </button>
            <button 
              onClick={() => handleNavClick("services")} 
              className="text-sm font-semibold text-zinc-650 hover:text-blue-900 transition-colors cursor-pointer"
            >
              Services
            </button>
            <button 
              onClick={() => handleNavClick("booking-section-wrapper")} 
              className="text-sm font-semibold text-zinc-650 hover:text-blue-900 transition-colors cursor-pointer"
            >
              Book Now
            </button>
          </nav>

          {/* User Sign In and Direct Call clickable Button */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => {
                setActiveView("profile");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center space-x-2 text-xs font-mono uppercase tracking-wider px-4 py-2.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                activeView === "profile" 
                  ? "bg-slate-900 text-white border-transparent font-semibold font-sans" 
                  : "bg-white border-zinc-200 text-zinc-700 hover:text-blue-900 hover:border-zinc-350"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{user ? `Hi, ${getFirstName()}` : "Traveler Dashboard"}</span>
            </button>

            <a 
              href="tel:+919525062666" 
              className="flex items-center space-x-2 text-sm font-semibold text-blue-900 hover:text-white bg-blue-50 hover:bg-slate-900 px-4 py-2 rounded-lg border border-blue-105 transition-all font-mono shadow-sm"
            >
              <Phone className="w-4 h-4" />
              <span>+91 9525062666</span>
            </a>
          </div>

          {/* Mobile Navigation Drawer Control */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveView("profile");
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`p-2 rounded-lg border transition-all shadow-sm ${
                activeView === "profile" 
                  ? "border-blue-900 text-blue-905 bg-blue-50" 
                  : "border-zinc-200 text-zinc-600 bg-white"
              }`}
              title="Dashboard"
            >
              <UserIcon className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-700 hover:text-zinc-900 focus:outline-none cursor-pointer bg-white border border-zinc-200 rounded-lg shadow-sm"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Block */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-zinc-200 overflow-hidden shadow-md"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <button 
                onClick={() => { setActiveView("home"); setMobileMenuOpen(false); }}
                className="block text-sm font-semibold text-zinc-700 hover:text-blue-900 py-1 text-left w-full cursor-pointer"
              >
                Home
              </button>
              <button 
                onClick={() => handleNavClick("fleet")} 
                className="block text-sm font-semibold text-zinc-700 hover:text-blue-900 py-1 text-left w-full cursor-pointer"
              >
                Our Fleet
              </button>
              <button 
                onClick={() => handleNavClick("about")} 
                className="block text-sm font-semibold text-zinc-700 hover:text-blue-900 py-1 text-left w-full cursor-pointer"
              >
                Why Tashu
              </button>
              <button 
                onClick={() => handleNavClick("services")} 
                className="block text-sm font-semibold text-zinc-700 hover:text-blue-900 py-1 text-left w-full cursor-pointer"
              >
                Services
              </button>
              <button 
                onClick={() => handleNavClick("booking-section-wrapper")} 
                className="block text-sm font-semibold text-zinc-700 hover:text-blue-900 py-1 text-left w-full cursor-pointer"
              >
                Book Now
              </button>
              
              <div className="pt-3 border-t border-zinc-200 flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setActiveView("profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-zinc-50 border border-zinc-200 py-2.5 rounded-lg text-sm text-blue-900 font-semibold"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user ? `Dashboard (${getFirstName()})` : "Traveler Dashboard Sign In"}</span>
                </button>

                <a 
                  href="tel:+919525062666" 
                  className="flex items-center justify-center space-x-2 text-sm font-semibold text-blue-900 bg-blue-50 py-2.5 rounded-lg border border-blue-200 font-mono"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call +91 9525062666</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic View Swapper */}
      <AnimatePresence mode="wait">
        {activeView === "home" ? (
          <motion.main
            key="home-viewport"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* 2. Hero Section - Elegantly styled off-white showcase */}
            <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 bg-white" id="hero">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-900/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-zinc-100 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center space-x-2 bg-zinc-100/90 px-4 py-1.5 rounded-full border border-zinc-200/80 mb-6 sm:mb-8 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-slate-800" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                    Trusted Family-Owned Travel Partner
                  </span>
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]"
                >
                  Comfortable Premium Travel With <span className="text-blue-900 bg-gradient-to-r from-blue-900 to-slate-900 bg-clip-text text-transparent">Trusted Drivers</span>
                </motion.h1>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-zinc-650 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mt-6 leading-relaxed"
                >
                  Comfortable, clean, and safe rides for outstation trips, airport transfers, corporate duties, weddings, and premium local hire.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
                >
                  <button 
                    onClick={() => handleSelectCarForBooking(selectedCar)}
                    className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 font-semibold text-sm px-8 py-3.5 rounded-lg transition-all duration-300 hover:shadow-lg text-center cursor-pointer shadow-md shadow-zinc-350"
                  >
                    Reserve Ride Desk
                  </button>
                  
                  <button 
                    onClick={handleGeneralWhatsApp}
                    className="w-full sm:w-auto bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-sm px-8 py-3.5 rounded-lg border border-zinc-200 hover:border-zinc-350 transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <span>Instant WhatsApp Estimate</span>
                    <Send className="w-4 h-4 text-blue-900" />
                  </button>
                </motion.div>
              </div>
            </section>

            {/* 3. About & Trust Pillars Grid - Premium White Luxury theme */}
            <section className="bg-zinc-50 py-20 border-t border-zinc-200/80" id="about">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center mb-16">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-2 font-bold">Our Foundation</h2>
                  <p className="text-3xl font-display font-bold text-zinc-900">Chauffeur-Driven Trust & Luxury Quality</p>
                  <span className="block w-12 h-1 bg-gradient-to-r from-blue-950 to-blue-900 mx-auto mt-3 rounded-full"></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  
                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl shadow-zinc-200/35 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-105 text-blue-900 mb-5 shadow-sm">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-sans font-semibold text-zinc-900 mb-2">Pristine Clean Cars</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Every car undergoes comprehensive wet scrubbing and full inner cabin sanitation before reporting for duty. Flawless cleanliness guaranteed.
                    </p>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl shadow-zinc-200/35 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-800 mb-5 shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-sans font-semibold text-zinc-900 mb-2">Verified Drive Team</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Liaison chauffeurs trained for safe navigation limits, courteous conduct, state border commercial compliance, and timing accuracy.
                    </p>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl shadow-zinc-200/35 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-105 text-blue-900 mb-5 shadow-sm">
                      <Award className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-sans font-semibold text-zinc-900 mb-2">Direct Proprietor Desk</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Connect directly with family owners for modifications, custom routes, or late-night schedule transitions without automated call center barriers.
                    </p>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl shadow-zinc-200/35 hover:-translate-y-1 transition-all duration-300">
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-150 text-emerald-800 mb-5 shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-sans font-semibold text-zinc-900 mb-2">Billing Transparency</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Accurate upfront trip blueprints enclosing real state taxes, toll counts, and driver night allowances. Zero hidden charges or post-ride hassles.
                    </p>
                  </div>

                </div>

              </div>
            </section>

            {/* 4. Fleet Section - Dynamic Fetching with Skeleton state */}
            <section className="bg-white py-20 border-t border-zinc-200/80" id="fleet">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="text-center mb-16">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-2 font-bold select-none">Available Classes</h2>
                  <p className="text-3.5xl font-display font-extrabold text-zinc-900">Chauffeur Driven Executive Fleets</p>
                  <span className="block w-12 h-1 bg-gradient-to-r from-blue-955 to-blue-900 mx-auto mt-3 rounded-full"></span>
                </div>

                {carsLoading ? (
                  /* Elegant Light Skeleton Loader while loading */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((idx) => (
                      <div key={idx} className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden p-6 space-y-4 animate-pulse">
                        <div className="h-44 bg-zinc-200 rounded-xl w-full" />
                        <div className="h-6 bg-zinc-200 rounded w-2/3" />
                        <div className="h-4 bg-zinc-200 rounded w-1/2" />
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div className="h-10 bg-zinc-250 rounded" />
                          <div className="h-10 bg-zinc-250 rounded" />
                          <div className="h-10 bg-zinc-250 rounded" />
                        </div>
                        <div className="space-y-2 pt-2">
                          <div className="h-4 bg-zinc-200 rounded w-full" />
                          <div className="h-4 bg-zinc-200 rounded w-5/6" />
                        </div>
                        <div className="flex justify-between items-center pt-4">
                          <div className="h-8 bg-zinc-200 rounded w-24" />
                          <div className="h-8 bg-zinc-250 rounded w-28" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {fleetCars.map((car) => (
                      <div 
                        key={car.id} 
                        className="group relative bg-white border border-zinc-200 hover:border-zinc-350 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-zinc-200/70"
                      >
                        <div className="relative h-48 overflow-hidden bg-zinc-100">
                          <img 
                            src={car.id === "Ertiga" ? "https://upload.wikimedia.org/wikipedia/commons/d/de/2019_Suzuki_Ertiga_GL_1.5_front_view_%28Indonesia%29.jpg" : car.id === "Innova Crysta" ? "https://upload.wikimedia.org/wikipedia/commons/e/ea/Toyota_Innova_Crysta_2.4_V_%28GGN155%29_front_view%2C_Kuala_Lumpur.jpg" : car.image} 
                            alt={car.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-80" />
                          
                          {/* Accent Color Badge: Deep luxury Navy Badge */}
                          <span className="absolute top-4 right-4 bg-slate-900 border border-zinc-800 text-white text-[10px] font-mono tracking-wider font-semibold uppercase px-3 py-1 rounded-full">
                            {car.category}
                          </span>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-xl font-display font-medium text-slate-900 flex items-center justify-between">
                              <span>{car.name}</span>
                              {!car.isAvailable && (
                                <span className="text-[10px] bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-bold">In-Service</span>
                              )}
                            </h3>
                            
                            <div className="grid grid-cols-3 gap-2 mt-4 pb-4 border-b border-zinc-150 text-center">
                              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                                <Users className="w-3.5 h-3.5 mx-auto text-zinc-500 mb-1" />
                                <span className="block text-[10px] font-mono text-zinc-700 font-bold">{car.seats} Seats</span>
                              </div>
                              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                                <Briefcase className="w-3.5 h-3.5 mx-auto text-zinc-500 mb-1" />
                                <span className="block text-[10px] font-mono text-zinc-700 font-bold">{car.bags} Luggage</span>
                              </div>
                              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                                <Wind className="w-3.5 h-3.5 mx-auto text-zinc-500 mb-1" />
                                <span className="block text-[10px] font-mono text-zinc-700 font-bold">Dual AC</span>
                              </div>
                            </div>

                            <ul className="space-y-2 mt-4 text-left">
                              {car.features.map((feat, idx) => (
                                <li key={idx} className="flex items-center text-xs text-zinc-600">
                                  <CheckCircle className="w-3.5 h-3.5 text-blue-900 mr-2 shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-6 pt-4 border-t border-zinc-150 flex items-center justify-between font-sans">
                            <div>
                              <span className="block text-[9px] font-mono uppercase tracking-widest text-zinc-400 font-bold">Pricing Category</span>
                              <span className="text-xs text-blue-900 font-bold">Standard Fleet Tariff</span>
                            </div>

                            <button 
                              onClick={() => handleSelectCarForBooking(car.id)}
                              className="bg-slate-900 hover:bg-blue-900 text-white font-semibold px-4 py-2.5 rounded-lg text-xs transition-all duration-300 flex items-center space-x-1.5 cursor-pointer shadow-sm"
                            >
                              <span>Lock Fleet Car</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 5. Services section - White luxury styling */}
            <section className="bg-zinc-50 py-16 border-t border-zinc-250/50" id="services">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div>
                  <h2 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-2 font-bold">Our Capabilities</h2>
                  <h3 className="text-3xl font-display font-bold text-zinc-900 mb-6">Designed for Every Travel Scenario</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed mb-8">
                    With deep commercial route knowledge and state border clearance expertise across North India, Tashu Travels deploys personalized transport coordinates to guarantee luxurious transitions.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {BUSINESS_SERVICES.map((serv, index) => (
                      <div key={index} className="flex items-start space-x-3 bg-white p-4.5 rounded-2xl border border-zinc-200/80 shadow-md shadow-zinc-100">
                        <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-900 shrink-0 shadow-sm" />
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 font-sans">{serv.title}</h4>
                          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{serv.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Main Interactive Booking Engine Section */}
            <section className="bg-white py-20 border-t border-zinc-200/80" id="booking-section-wrapper">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-2 font-bold">Reserve In Seconds</h2>
                  <h3 className="text-3.5xl font-display font-extrabold text-zinc-900">Secure Interactive Booking</h3>
                  <p className="text-zinc-550 text-xs sm:text-sm max-w-lg mx-auto mt-2 leading-relaxed">
                    Reserve customized luxury transport below. Access personal booking lists, verify traveler schedules, and secure guaranteed pricing.
                  </p>
                </div>

                {/* Passes down dynamic cars loaded from db */}
                <BookingForm selectedCar={selectedCar} carsList={fleetCars.map(c => ({ id: c.id, name: c.name }))} />
              </div>
            </section>

            {/* 7. Realistic Customer Reviews */}
            <section className="bg-zinc-50 py-16 border-t border-zinc-200/85">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-2 font-bold">Testimonials</h2>
                  <p className="text-2xl sm:text-3xl font-display font-bold text-zinc-900">Traveler Experience Stories</p>
                  <span className="block w-12 h-1 bg-gradient-to-r from-blue-955 to-blue-900 mx-auto mt-3 rounded-full"></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-200/30 flex flex-col justify-between">
                    <p className="text-xs text-zinc-600 italic leading-relaxed">
                      "We rented an Innova Crysta for a family trip to Agra and Delhi outstation. The car was incredibly neat and clean, but the standout was our chauffeur Rajesh. Extremely polite, drove safely within speed limits, and knew the best highway lanes. Magnificent service!"
                    </p>
                    <div className="mt-5 border-t border-zinc-150 pt-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 font-sans">Siddharth Sharma</h4>
                        <span className="block text-[10px] text-zinc-500">Corporate Director</span>
                      </div>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-200/30 flex flex-col justify-between">
                    <p className="text-xs text-zinc-600 italic leading-relaxed">
                      "Hired Tashu Travels for wedding shuttle duties in Chandigarh. They provided flawless white Ertigas and Scorpios. Highly co-operative team who managed dynamic route changes past midnight without a complaint. Recommend them 100%!"
                    </p>
                    <div className="mt-5 border-t border-zinc-150 pt-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 font-sans">Neelam Singhal</h4>
                        <span className="block text-[10px] text-zinc-500">Family Event Coordinator</span>
                      </div>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl shadow-zinc-200/30 flex flex-col justify-between">
                    <p className="text-xs text-zinc-600 italic leading-relaxed">
                      "Tashu Travels is my go-to for early morning IGI Airport runs. Extremely punctual. They send vehicle details and driver contacts 3 hours prior to pick up. Zero stress."
                    </p>
                    <div className="mt-5 border-t border-zinc-150 pt-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 font-sans">Amit Verma</h4>
                        <span className="block text-[10px] text-zinc-500">Frequent Airport Client</span>
                      </div>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.main>
        ) : (
          /* Profile / Account Dashboard View - Light Luxury matching */
          <motion.main
            key="profile-viewport"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <button 
                onClick={() => setActiveView("home")}
                className="flex items-center space-x-2 text-xs font-mono text-zinc-650 hover:text-blue-900 transition-colors uppercase tracking-widest cursor-pointer bg-white px-3.5 py-2.5 rounded-lg border border-zinc-200 shadow-sm font-semibold"
              >
                <Home className="w-3.5 h-3.5 text-blue-900" />
                <span>Return to Home Explorer</span>
              </button>
            </div>
            
            <UserProfile />
          </motion.main>
        )}
      </AnimatePresence>

      {/* 8. Footer Section - Pure White/Subtle Zinc luxury representation */}
      <footer className="bg-zinc-100 border-t border-zinc-250 text-zinc-500 py-16 mt-20" id="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">T</span>
              </div>
              <span className="text-md font-display font-bold tracking-wider text-slate-900">TASHU TRAVELS</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              Family-founded professional tourist transport networks across India. Premium automobiles driven by vetted commercial chauffeur teams.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-4 font-bold select-none">Quick Links</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><button onClick={() => { setActiveView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="hover:text-blue-900 text-zinc-600 transition-colors cursor-pointer text-left">Home</button></li>
              <li><button onClick={() => handleNavClick("fleet")} className="hover:text-blue-900 text-zinc-600 transition-colors cursor-pointer text-left">Premium Fleet</button></li>
              <li><button onClick={() => handleNavClick("about")} className="hover:text-blue-900 text-zinc-600 transition-colors cursor-pointer text-left">Proprietor Trust</button></li>
              <li><button onClick={() => handleNavClick("booking-section-wrapper")} className="hover:text-blue-900 text-zinc-600 transition-colors cursor-pointer text-left">Booking Engine</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-4 font-bold select-none">Travel Zones</h4>
            <ul className="space-y-2 text-xs text-zinc-600 font-semibold">
              <li>Delhi NCR Tour Desk</li>
              <li>Agra One-Way Expressway routes</li>
              <li>Punjab & Chandigarh Transfers</li>
              <li>Shimla & Himachal Outstations</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-blue-900 mb-4 font-bold select-none">Proprietor Desk</h4>
            <ul className="space-y-2 text-xs text-zinc-700 font-semibold">
              <li className="flex items-center">
                <Phone className="w-3.5 h-3.5 text-blue-900 mr-2 shrink-0 animate-pulse" />
                <a href="tel:+919525062666" className="hover:text-blue-900 transition-colors font-mono font-bold">+91 9525062666</a>
              </li>
              <li className="flex items-start">
                <MapPin className="w-3.5 h-3.5 text-blue-900 mr-2 shrink-0 mt-0.5" />
                <span className="text-zinc-500 font-medium leading-relaxed">Tashu Travels, Dwarka Sector 10, New Delhi 115075, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-zinc-200 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 font-medium">
          <p>© {new Date().getFullYear()} Tashu Travels. All rights reserved.</p>
          <p>Premium car and professional driver solutions across India.</p>
        </div>
      </footer>

    </div>
  );
}
