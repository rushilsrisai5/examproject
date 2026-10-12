import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Sparkles,
  KeyRound,
  CheckCircle2,
  GraduationCap,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ExamNovaLogo } from '../ExamNovaLogo';
import { UserRole } from '../../types';
import firebaseConfig from '../../../firebase-applet-config.json';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, authError, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [activeGoogleRole, setActiveGoogleRole] = useState<UserRole | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleGoogleLogin = async (roleToAuth?: UserRole) => {
    const targetRole = roleToAuth || selectedRole;
    setValidationError(null);
    clearError();
    setIsGoogleSubmitting(true);
    setActiveGoogleRole(targetRole);
    try {
      await loginWithGoogle(targetRole);
    } finally {
      setIsGoogleSubmitting(false);
      setActiveGoogleRole(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Please enter your examination university email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address (e.g., admin@examflow.edu).');
      return;
    }
    if (!password) {
      setValidationError('Password is required to authenticate.');
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail(trimmedEmail, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (testEmail: string, testPass: string, role?: UserRole) => {
    setEmail(testEmail);
    setPassword(testPass);
    if (role) setSelectedRole(role);
    setValidationError(null);
    clearError();
  };

  const displayError = validationError || authError;
  const isUnauthorizedDomain = displayError?.includes('auth/unauthorized-domain') ?? false;
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-64 bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ExamNovaLogo size={40} showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                Exam<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Nova</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                Institutional Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Smart Examination Section Management System
            </p>
          </div>
        </div>
      </header>

      {/* Main Login Workspace Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Brand & Role-based Google Auth Portals */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Firebase Cloud Firestore & Google Authentication</span>
            </div>

            <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
              Institutional Examination Management,{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-sky-300 bg-clip-text text-transparent">
                Secured by Role.
              </span>
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed">
              ExamNova orchestrates seating capacity validation, invigilator roll sheet reconciliation, and candidate schedule publication stored persistently in Google Cloud Firestore.
            </p>

            <div className="space-y-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Google Sign-In with Firebase Auth identity verification for all roles</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time Cloud Firestore seating allocation and attendance tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Institutional role authorization enforced with hardened security rules</span>
              </div>
            </div>

            {/* Google Authentication Portals by Role (No 1-Click bypass) */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Google Authentication Portals
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">Cloud Firestore Verified</span>
              </div>

              {/* 1. Admin Role Google Auth */}
              <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Administrator</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                      Admin
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono truncate">rushilsrisai5@gmail.com</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fillCredentials('rushilsrisai5@gmail.com', 'Admin@2026!', 'admin')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer transition-colors"
                  >
                    Fill Form
                  </button>
                  <button
                    type="button"
                    disabled={isGoogleSubmitting}
                    onClick={() => handleGoogleLogin('admin')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isGoogleSubmitting && activeGoogleRole === 'admin' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Sign In with Google</span>
                  </button>
                </div>
              </div>

              {/* 2. In-Charge Role Google Auth */}
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Exam In-Charge</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-700 text-white px-1.5 py-0.2 rounded">
                      In-Charge
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono truncate">incharge@examflow.edu</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fillCredentials('incharge@examflow.edu', 'Incharge@2026!', 'incharge')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer transition-colors"
                  >
                    Fill Form
                  </button>
                  <button
                    type="button"
                    disabled={isGoogleSubmitting}
                    onClick={() => handleGoogleLogin('incharge')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isGoogleSubmitting && activeGoogleRole === 'incharge' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Sign In with Google</span>
                  </button>
                </div>
              </div>

              {/* 3. Student Role Google Auth */}
              <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                    <span>Candidate Portal</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-sky-700 text-white px-1.5 py-0.2 rounded">
                      Student
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono truncate">student@examflow.edu</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fillCredentials('student@examflow.edu', 'Student@2026!', 'student')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer transition-colors"
                  >
                    Fill Form
                  </button>
                  <button
                    type="button"
                    disabled={isGoogleSubmitting}
                    onClick={() => handleGoogleLogin('student')}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isGoogleSubmitting && activeGoogleRole === 'student' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Sign In with Google</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Test invalid credentials scenario:</span>
                <button
                  type="button"
                  onClick={() => fillCredentials('norole@examflow.edu', 'Test@2026!')}
                  className="text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
                >
                  Fill Unassigned Role Account
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Modern Login Card with Google Auth & Role Selector */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-950/50 border border-slate-200/80 p-6 sm:p-8 text-slate-900">
              
              {/* Form Header */}
              <div className="text-center sm:text-left mb-5">
                <div className="inline-flex lg:hidden w-10 h-10 rounded-xl bg-indigo-600 items-center justify-center text-white mb-3 shadow-md shadow-indigo-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome to ExamNova
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Authenticate using Firebase with Google Sign-In.
                </p>
              </div>

              {/* Role Selection Tabs for Google Login */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Target Portal Role:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('incharge')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedRole === 'incharge'
                        ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>In-Charge</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedRole === 'student'
                        ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>
                </div>
              </div>

              {/* Error Message Box */}
              {displayError && (
                <div 
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 text-xs animate-shake"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed flex-1">
                      <span className="font-bold block text-rose-900">
                        {displayError.includes('unauthorized-domain') 
                          ? 'Firebase Domain Authorization (auth/unauthorized-domain)' 
                          : 'Authentication Notice'}
                      </span>
                      <p className="text-rose-800 mt-0.5">
                        {isUnauthorizedDomain
                          ? 'Firebase Authentication rejected this Google sign-in because the current app hostname is not authorized for this Firebase project.'
                          : displayError}
                      </p>
                    </div>
                  </div>

                  {isUnauthorizedDomain && (
                    <div className="pt-2 border-t border-rose-200/70 space-y-2 text-[11px] text-rose-950">
                      <p>
                        In Firebase Console for project <strong>{firebaseConfig.projectId}</strong>,
                        open <strong>Authentication → Settings → Authorized domains</strong> and add:
                      </p>
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-bold text-rose-900 underline"
                      >
                        Open Firebase Authentication settings
                      </a>
                      <code className="block rounded-md bg-rose-100/60 p-2 font-mono font-bold break-all">
                        {currentHostname || 'the hostname shown in the browser address bar'}
                      </code>
                      <p>
                        Enter only the hostname (no protocol, port, or path). Then reload this page and retry Google sign-in.
                        Preview and production hostnames must each be added separately.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Main Role-Specific Google Sign-In Button */}
              <button
                type="button"
                onClick={() => handleGoogleLogin(selectedRole)}
                disabled={isGoogleSubmitting || isSubmitting}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow disabled:opacity-60 cursor-pointer mb-4"
              >
                {isGoogleSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Signing in with Google ({selectedRole.toUpperCase()})...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      Sign in with Google as{' '}
                      <span className="capitalize font-black text-indigo-700">
                        {selectedRole === 'incharge' ? 'Exam In-Charge' : selectedRole}
                      </span>
                    </span>
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Or authenticate with email
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label 
                    htmlFor="email-input" 
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    University Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="e.g. admin@examflow.edu"
                      disabled={isSubmitting || isGoogleSubmitting}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="password-input" 
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      placeholder="••••••••••••"
                      disabled={isSubmitting || isGoogleSubmitting}
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all disabled:opacity-60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Mobile Role Google Sign-In Helper (No 1-Click bypass) */}
              <div className="mt-6 pt-5 border-t border-slate-100 lg:hidden space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Authenticate with Google by Role:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    disabled={isGoogleSubmitting}
                    onClick={() => handleGoogleLogin('admin')}
                    className="py-2 px-2 text-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 cursor-pointer disabled:opacity-60"
                  >
                    Google (Admin)
                  </button>
                  <button
                    type="button"
                    disabled={isGoogleSubmitting}
                    onClick={() => handleGoogleLogin('incharge')}
                    className="py-2 px-2 text-center rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 cursor-pointer disabled:opacity-60"
                  >
                    Google (In-Charge)
                  </button>
                  <button
                    type="button"
                    disabled={isGoogleSubmitting}
                    onClick={() => handleGoogleLogin('student')}
                    className="py-2 px-2 text-center rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 cursor-pointer disabled:opacity-60"
                  >
                    Google (Student)
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center text-[11px] text-slate-400">
                Protected by Google Firebase Auth and Cloud Firestore. Dashboard access requires database-verified role authorization.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        ExamNova &copy; 2026 Institutional Examination Section.
      </footer>
    </div>
  );
};
