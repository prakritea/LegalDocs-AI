import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  Shield,
  Users,
  Zap,
  Menu,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate, useLocation } from "react-router-dom";
import Threads from "@/components/Threads";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { toast } from "sonner";


export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organization: '',
    agreeToTerms: false,
    rememberMe: false
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint = isSignUp ? "/signup" : "/login";
    const payload = isSignUp
      ? {
        username: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        organization: formData.organization,
      }
      : {
        username: formData.email,
        password: formData.password,
      };

    try {
      const response = await api.post<{ access_token: string, user: any }>(endpoint, payload);
      const data = response.data;

      if (data.access_token && data.user) {
        login(data.access_token, data.user, formData.rememberMe);
        toast.success(isSignUp ? "Account created and logged in!" : "Logged in successfully!");

        const from = (location.state as any)?.from || "/dashboard";
        navigate(from, { replace: true });
      } else {
        if (isSignUp) {
          toast.success("Signup successful! Please log in.");
          setIsSignUp(false);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to connect to the server.";
      toast.error(errorMsg);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'twitter') => {
    // Backend OAuth entry point
    const backendUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : ''; // In prod, it should be proxied or relative

    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };


  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col">
      {/* Threads Background */}
      <div className="fixed inset-0 z-0 opacity-40 select-none pointer-events-none">
        <Threads
          amplitude={1.2}
          distance={0.2}
          enableMouseInteraction={true}
        />
      </div>

      {/* Pill Navbar */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="flex items-center justify-between h-14 px-8 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl max-w-4xl w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white uppercase tracking-wider">LegalDocs AI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-4 right-4 md:hidden py-4 px-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col space-y-3">
              <Link to="/features" className="text-zinc-400 hover:text-white px-3 py-2 text-sm font-medium">
                Features
              </Link>
              <Link to="/how-it-works" className="text-zinc-400 hover:text-white px-3 py-2 text-sm font-medium">
                How It Works
              </Link>
              <Link to="/" className="text-zinc-400 hover:text-white px-3 py-2 text-sm font-medium flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center p-4 z-10 w-full mx-auto min-h-screen">
        <div className="w-full max-w-lg mt-8">
          <Card className="shadow-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
            <CardHeader className="space-y-4 pb-8">
              <div className="text-center">
                <Badge variant="outline" className="mb-4 px-3 py-1 text-xs uppercase tracking-widest text-brand-400 border-brand-800/50">
                  {isSignUp ? 'Free Trial' : 'Secure Access'}
                </Badge>
                <CardTitle className="text-3xl font-bold text-white tracking-tight">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-2 text-lg">
                  {isSignUp
                    ? 'Start your free trial today - no credit card required'
                    : 'Sign in to your LegalDocs AI account'
                  }
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-zinc-300">First name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Your Name"
                          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-brand-500"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-zinc-300">Last name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Last Name"
                          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-brand-500"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization" className="text-zinc-300">Organization</Label>
                      <Input
                        id="organization"
                        type="text"
                        placeholder="Your law firm or company"
                        className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-brand-500"
                        value={formData.organization}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-brand-500"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                      className="pl-10 pr-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-brand-500"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-brand-500"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {!isSignUp && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        className="border-zinc-700 bg-zinc-900"
                        checked={formData.rememberMe}
                        onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm text-zinc-400">
                        Remember me
                      </Label>
                    </div>
                    <Link to="/forgot-password" className="text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium">
                      Forgot password?
                    </Link>
                  </div>
                )}

                {isSignUp && (
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      className="border-zinc-700 bg-zinc-900 mt-1"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm text-zinc-400 leading-relaxed">
                      I agree to the{' '}
                      <Link to="/terms" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">Privacy Policy</Link>
                    </Label>
                  </div>
                )}

                <Button type="submit" className="w-full bg-brand-800 hover:bg-brand-700 text-white border-0 py-6 text-lg font-semibold shadow-lg shadow-brand-900/20" size="lg">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
              </form>



              <div className="text-center pt-2">
                <span className="text-zinc-500">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </span>
                {' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-brand-400 hover:text-brand-300 transition-colors font-semibold"
                >
                  {isSignUp ? 'Sign in' : 'Start free trial'}
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500">
              Need help?{' '}
              <Link to="/support" className="text-zinc-400 hover:text-white transition-colors font-medium underline underline-offset-4">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-zinc-600 text-xs border-t border-zinc-900/50 z-10">
        &copy; {new Date().getFullYear()} LegalDocs AI. All rights reserved. Professional Grade Legal Analysis.
      </footer>
    </div>
  );
}
