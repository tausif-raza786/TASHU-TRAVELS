import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export interface UserProfileData {
  fullName: string;
  phone: string;
  email: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfileData | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateContactInfo: (fullName: string, phone: string) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch or create user profile on login
        const profileRef = doc(db, "users", currentUser.uid);
        
        // Listen Real-time to profile changes
        const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfileData);
          } else {
            // Profile doesn't exist yet, we will create a skeleton (e.g. from Google sign-in)
            const fallbackProfile: UserProfileData = {
              fullName: currentUser.displayName || "Premium Customer",
              phone: currentUser.phoneNumber || "",
              email: currentUser.email || "",
              updatedAt: new Date().toISOString()
            };
            setDoc(profileRef, fallbackProfile).catch(err => {
              console.error("Error bootstrapping initial profile:", err);
            });
            setUserProfile(fallbackProfile);
          }
        }, (error) => {
          console.error("Profile onSnapshot error:", error);
        });

        // Store subscription inside nested return or state to clean up if needed
        return unsubscribeProfile;
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const clearAuthError = () => setAuthError(null);

  // Google Single Sign-On
  const signInWithGoogle = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === "auth/popup-blocked" || (err.message && err.message.includes("popup-blocked"))) {
        setAuthError(
          "The Google Login popup was blocked by your browser. Please allow popups for this site, click the 'Open in New Tab' button in the top-right corner of the preview to run the application in its own tab, or log in below using Email & Password."
        );
      } else {
        setAuthError(err.message || "Could not complete Google Sign-In.");
      }
      throw err;
    }
  };

  // Create account with email & password
  const signUpWithEmail = async (email: string, password: string, fullName: string, phone: string) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Set auth display name
      await updateProfile(newUser, { displayName: fullName });

      // Create main profile document in Firestore
      const profileRef = doc(db, "users", newUser.uid);
      const profileData: UserProfileData = {
        fullName,
        phone,
        email,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(profileRef, profileData);
      setUserProfile(profileData);
    } catch (err: any) {
      console.error("Email registration error:", err);
      setAuthError(err.message || "Failed to register new account.");
      throw err;
    }
  };

  // Sign in with existing email/password
  const signInWithEmail = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Email login error:", err);
      setAuthError(err.message || "Credentials incorrect or login failed.");
      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Logout error:", err);
      setAuthError(err.message || "Could not sign out properly.");
    }
  };

  // Update profile contact details
  const updateContactInfo = async (fullName: string, phone: string) => {
    if (!user) throw new Error("User must be authenticated to update contact details");
    setAuthError(null);
    try {
      const profileRef = doc(db, "users", user.uid);
      const updatedProfile: UserProfileData = {
        fullName,
        phone,
        email: user.email || "",
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(profileRef, updatedProfile, { merge: true });
      setUserProfile(prev => ({
        ...prev,
        ...updatedProfile
      }));
    } catch (err: any) {
      console.error("Profile update error:", err);
      setAuthError(err.message || "Could not update contact info.");
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      authError,
      signInWithGoogle,
      signUpWithEmail,
      signInWithEmail,
      logout,
      updateContactInfo,
      clearAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
