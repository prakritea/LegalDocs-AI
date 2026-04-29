import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Sparkles,
  Shield,
  Search,
  Users,
  CheckCircle2,
  BarChart3,
  Lock,
  Zap,
  Play,
  Menu,
  X,
  AlertTriangle,
  Network,
  Layers,
  Brain,
  ArrowRight,
  Calendar,
  Book
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import UploadCourtCase from "./UploadCourtCase";
import Threads from "@/components/Threads";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EngineeringPipeline = () => {
  const steps = [
    {
      id: "ingest",
      title: "Document Ingestion",
      icon: <FileText className="w-5 h-5" />,
      description: "Extracting semantic layers from raw PDF buffers.",
      color: "blue"
    },
    {
      id: "chunk",
      title: "Semantic Chunking",
      icon: <Layers className="w-5 h-5" />,
      description: "Recursive splitting with token overlap for 100% recall.",
      color: "purple"
    },
    {
      id: "analyze",
      title: "Distributed Analysis",
      icon: <Brain className="w-5 h-5" />,
      description: "Parallel LLM passes extracting granular intelligence.",
      color: "brand"
    },
    {
      id: "synthesize",
      title: "Intelligence Synthesis",
      icon: <Sparkles className="w-5 h-5" />,
      description: "Consolidating vectors into the final structured suite.",
      color: "green"
    }
  ];

  return (
    <div className="py-12">
      <div className="relative max-w-5xl mx-auto px-4">
        {/* Connection Line */}
        <div className="hidden md:block absolute top-[40px] left-0 right-0 h-[2px] bg-zinc-800 z-0">
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-blue-500 via-brand-500 to-green-500 origin-left"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex flex-col items-center text-center group"
            >
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border-2 transition-all duration-500",
                "bg-zinc-950 border-zinc-800 group-hover:border-brand-500 group-hover:shadow-[0_0_30px_rgba(var(--brand-rgb),0.2)]",
                index === 0 && "group-hover:border-blue-500",
                index === 1 && "group-hover:border-purple-500",
                index === 3 && "group-hover:border-green-500"
              )}>
                {step.icon}
              </div>
              <h4 className="text-white font-bold mb-2 group-hover:text-brand-400 transition-colors uppercase tracking-widest text-xs">
                {step.title}
              </h4>
              <p className="text-zinc-500 text-sm leading-relaxed font-light px-4">
                {step.description}
              </p>
              
              {/* Mobile Arrow */}
              {index < steps.length - 1 && (
                <div className="md:hidden mt-8 mb-4">
                  <ArrowRight className="w-6 h-6 text-zinc-800 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Index() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleStartSummarizing = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate("/signin", { state: { from: "/" } });
    }
  };

  const { scrollY } = useScroll();
  const navBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(24, 24, 27, 0.5)", "rgba(9, 9, 11, 0.8)"]
  );
  const navBorder = useTransform(
    scrollY,
    [0, 100],
    ["rgba(39, 39, 42, 1)", "rgba(39, 39, 42, 0.6)"]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const GlowCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -5, scale: 1.02 }}
        className={cn(
          "relative p-6 border border-zinc-800 shadow-sm transition-all duration-300 bg-zinc-950/50 backdrop-blur-sm group overflow-hidden rounded-3xl",
          className
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.4 : 0,
            background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--brand-rgb), 0.2), transparent 40%)`,
          }}
        />
        {children}
      </motion.div>
    );
  };

  const features = [
    {
      title: "Advanced Legal Intelligence",
      description: "Deep analysis using high-context LLMs with 1M+ token windows. We process documents using intelligent chunking to ensure 100% recall.",
      icon: Sparkles
    },
    {
      title: "Interactive Legal Timeline",
      description: "A chronological view of all critical dates, renewal deadlines, and milestones extracted from the document with priority-based tags.",
      icon: Calendar
    },
    {
      title: "Definitions Explorer",
      description: "An instant glossary of all legal terms and party definitions. No more scrolling back and forth to find defined terms.",
      icon: Book
    },
    {
      title: "Relationship Mapping",
      description: "Visual mapping of connections between parties, organizations, and legal roles to understand complex dependencies instantly.",
      icon: Network
    },
    {
      title: "Risk & Severity Scoring",
      description: "Numeric risk assessment (1-10) for every identified liability, paired with specific AI-generated mitigation strategies.",
      icon: AlertTriangle
    },
    {
      title: "Detailed Page Intelligence",
      description: "Comprehensive textual summaries for every section, backed by verified segment intelligence and source citations.",
      icon: FileText
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <motion.header 
        style={{ backgroundColor: navBackground, borderColor: navBorder }}
        className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
      >
        <div className="flex items-center justify-between h-14 px-8 rounded-full border border-inherit backdrop-blur-xl max-w-4xl w-full transition-all duration-500">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LegalDocs AI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              How It Works
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="text-sm font-medium text-zinc-400 hover:text-white h-auto p-0 hover:bg-transparent" onClick={logout}>
                  Log Out
                </Button>
              </div>
            ) : (
              <Link to="/signin" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                Sign In
              </Link>
            )}
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
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 md:hidden py-4 px-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-xl"
            >
              <div className="flex flex-col space-y-3">
                <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white px-3 py-2 text-sm font-medium">
                  Features
                </Link>
                <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white px-3 py-2 text-sm font-medium">
                  How It Works
                </Link>
                <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="text-zinc-400 hover:text-white px-3 py-2 text-sm font-medium">
                  Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center py-20 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
        {/* Threads Background */}
        <div className="absolute inset-0 z-0 opacity-40 select-none pointer-events-none">
          <Threads
            amplitude={1.2}
            distance={0.2}
            enableMouseInteraction={true}
            color={[1, 1, 1]}
          />
        </div>

        <motion.div 
          className="relative z-10 max-w-4xl mx-auto text-center w-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-sm font-medium text-zinc-400 mb-8 backdrop-blur-md">
            <span className="text-zinc-600 font-mono">///</span>
            <span>Legal Analysis Platform</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight">
            Transform Legal Documents with{" "}
            <span className="text-brand-400">AI Intelligence</span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Upload, manage, and instantly summarize legal documents with our advanced AI
            platform. Save hours of reading time.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" onClick={handleStartSummarizing}>
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 px-10 py-4 text-lg rounded-full font-semibold transition-all duration-300">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Summarizing
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="px-10 py-4 text-lg rounded-full border-zinc-800 bg-zinc-900/30 text-white hover:bg-zinc-800 transition-all duration-300 backdrop-blur-sm"
              onClick={() => setShowDemoVideo(true)}
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {showDemoVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden max-w-3xl w-full relative">
            <button
              onClick={() => setShowDemoVideo(false)}
              className="absolute top-3 right-3 z-50 text-gray-700 dark:text-gray-200 hover:text-red-500"
            >
              <X className="w-6 h-6" />
            </button>
            <video
              src="/demo-video.mp4"
              controls
              autoPlay
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Features Section */}
      <section id="features" className="relative py-32 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 bg-brand-500/10 text-brand-400 border-brand-500/20 px-4 py-1">
              Intelligence Suite
            </Badge>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
            >
              Advanced Legal Intelligence
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-zinc-400 max-w-3xl mx-auto font-light"
            >
              Our v2.0 suite processes million-token documents with localized precision and structural awareness.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard className="h-full">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:border-brand-500/50 transition-colors">
                    <feature.icon className="w-6 h-6 text-zinc-400 group-hover:text-brand-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed font-light">
                    {feature.description}
                  </p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-black border-y border-zinc-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500"
            >
              How it works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-zinc-400 max-w-2xl mx-auto"
            >
              Get started in three simple steps and transform your document workflow today.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-zinc-800 via-brand-900 to-zinc-800 z-0" />

            {[
              {
                step: "01",
                title: "Upload Documents",
                description: "Securely upload your legal documents. We support PDF, DOC, and more.",
                delay: 0.2
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our advanced models analyze clauses, define terms, and extract key insights.",
                delay: 0.3
              },
              {
                step: "03",
                title: "Get Summaries",
                description: "Receive comprehensive, citation-backed summaries in seconds.",
                delay: 0.4
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay }}
                className="relative z-10"
              >
                <div className="group text-center p-8 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-brand-900 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-900/10">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-bold text-white group-hover:bg-brand-600 group-hover:scale-110 transition-all duration-300 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering Pipeline Section */}
      <section className="py-24 bg-black border-t border-zinc-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Our Summarization Architecture
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto font-light leading-relaxed">
              We don't just "read" documents. We reconstruct them through a multi-pass RAG pipeline designed for 100% legal precision.
            </p>
          </div>

          <EngineeringPipeline />

          <div className="mt-20 text-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-slate-800 hover:bg-gray-100 px-10 py-4 rounded-md font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95">
                Experience the Intelligence
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="mt-4 text-zinc-500 text-sm italic">
              Production-grade PDF parsing. Zero data loss.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo and Description */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-900" />
                </div>
                <span className="text-lg font-semibold">LegalDocs AI</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transforming legal document management with AI-powered intelligence.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-medium mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/features" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Features
                  </Link>
                </li>
                <li>
                  <a href="/api" className="text-gray-400 hover:text-white transition-colors text-sm">
                    API
                  </a>
                </li>
                <li>
                  <a href="/security" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-medium mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                    About
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/careers" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/blog" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-medium mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/compliance" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 border-t border-zinc-800">
            <div className="text-center text-gray-400 text-sm">
              <p>&copy; 2025 LegalDocs AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
