"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Printer,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Languages,
  Plus,
  Trash2,
  CheckCircle2,
  Palette,
  Eye,
  Edit3,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  X,
  Wand2,
  Loader2,
  Check,
  AlertCircle,
  Download,
  Upload,
} from "lucide-react";
import {
  ResumePreview,
  PersonalInfoData,
  ExperienceItem,
  EducationItem,
  SkillItem,
  LanguageItem,
  ResumeSectionData,
} from "@/components/editor/ResumePreview";

const COLOR_OPTIONS = [
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Émeraude", hex: "#059669" },
  { name: "Ambre", hex: "#D97706" },
  { name: "Rubis", hex: "#DC2626" },
  { name: "Ciel", hex: "#0284C7" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Rose", hex: "#DB2777" },
];

const TEMPLATE_OPTIONS = [
  { id: "modern", name: "Moderne", desc: "Design 2 colonnes dynamique & épuré" },
  { id: "classic", name: "Classique", desc: "Format traditionnel élégant" },
  { id: "minimal", name: "Minimaliste", desc: "Typographie légère & directe" },
  { id: "creative", name: "Créatif", desc: "En-tête visuel & blocs colorés" },
];

const AI_SUMMARY_SUGGESTIONS = [
  {
    role: "Développeur Full-Stack / Software Engineer",
    text: "Développeur Full-Stack passionné avec 4+ ans d'expérience dans la création d'applications web réactives et performantes (React, Next.js, Node.js). Spécialisé dans l'architecture SaaS et l'optimisation des API.",
  },
  {
    role: "Chef de Projet / Scrum Master",
    text: "Chef de projet certifié avec un solide bagage technique et managérial. Expert dans la conduite de projets agiles, la coordination d'équipes pluridisciplinaires et le respect strict des objectifs de livraison.",
  },
  {
    role: "Designer UI/UX & Produit",
    text: "Designer UI/UX axé sur la création d'interfaces intuitives et d'expériences utilisateur mémorables. Compétent dans la recherche utilisateur, le maquettage Figma et les systèmes de design.",
  },
  {
    role: "Responsable Marketing & Growth",
    text: "Spécialiste Growth & Marketing digital orienté données. Expertise avérée en SEO, campagnes d'acquisition multicanales et stratégies de rétention pour accélérer la croissance du chiffre d'affaires.",
  },
];

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params?.id as string;

  // Loading & Saving States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Profile Photo Upload State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout & UI States
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [activeFormSection, setActiveFormSection] = useState<
    "personal" | "experience" | "education" | "skill" | "language" | "order"
  >("personal");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Resume Content State
  const [title, setTitle] = useState("Mon CV");
  const [templateId, setTemplateId] = useState("modern");
  const [accentColor, setAccentColor] = useState("#4F46E5");

  const [sectionsOrder, setSectionsOrder] = useState<string[]>([
    "experience",
    "education",
    "skill",
    "language",
  ]);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: "",
  });

  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);

  // Accordion Expand/Collapse States
  const [expandedExp, setExpandedExp] = useState<number[]>([0]);
  const [expandedEdu, setExpandedEdu] = useState<number[]>([0]);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // AI Assistant Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTarget, setAiTarget] = useState<
    { field: "summary" } | { field: "expDescription"; index: number } | null
  >(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedAiRole, setSelectedAiRole] = useState(0);

  // Fetch Resume Data
  const fetchResume = useCallback(async () => {
    if (!resumeId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/resumes/${resumeId}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/dashboard");
        return;
      }
      const data = await res.json();
      const resume = data.resume;

      if (resume) {
        setTitle(resume.title || "Mon CV");
        setTemplateId(resume.template_id || "modern");
        setAccentColor(resume.accent_color || "#4F46E5");
        if (resume.photo_url) {
          setPhotoUrl(resume.photo_url);
        }

        const sectionsList: ResumeSectionData[] = resume.sections || [];

        if (sectionsList.length > 0) {
          const orderedTypes = sectionsList
            .filter((s) => s.type !== "personal")
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((s) => s.type);
          if (orderedTypes.length > 0) {
            setSectionsOrder(orderedTypes);
          }
        }

        sectionsList.forEach((sec) => {
          if (sec.type === "personal" && sec.data) {
            setPersonalInfo((prev) => ({
              ...prev,
              ...sec.data,
              photo_url: resume.photo_url || sec.data.photo_url,
            }));
          } else if (sec.type === "experience" && sec.data?.items) {
            setExperiences(sec.data.items);
            if (sec.data.items.length > 0) setExpandedExp([0]);
          } else if (sec.type === "education" && sec.data?.items) {
            setEducations(sec.data.items);
            if (sec.data.items.length > 0) setExpandedEdu([0]);
          } else if (sec.type === "skill" && sec.data?.items) {
            setSkills(sec.data.items);
          } else if (sec.type === "language" && sec.data?.items) {
            setLanguages(sec.data.items);
          }
        });
      }
    } catch (err) {
      console.error("Error loading resume:", err);
    } finally {
      setLoading(false);
      setIsInitialLoaded(true);
      setIsDirty(false);
    }
  }, [resumeId, router]);

  useEffect(() => {
    fetchResume();
  }, [fetchResume]);

  // Save Handler
  const handleSave = useCallback(async () => {
    if (!resumeId) return;
    setSaving(true);
    try {
      const formattedSections: ResumeSectionData[] = [
        {
          type: "personal",
          order_index: 0,
          data: { ...personalInfo, photo_url: photoUrl || undefined },
        },
        ...sectionsOrder.map((type, idx) => {
          let dataContent: any = {};
          if (type === "experience") dataContent = { title: "Expériences", items: experiences };
          if (type === "education") dataContent = { title: "Formations", items: educations };
          if (type === "skill") dataContent = { title: "Compétences", items: skills };
          if (type === "language") dataContent = { title: "Langues", items: languages };
          return {
            type,
            order_index: idx + 1,
            data: dataContent,
          };
        }),
      ];

      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          template_id: templateId,
          accent_color: accentColor,
          sections: formattedSections,
        }),
      });

      if (res.ok) {
        setLastSaved(
          new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        );
        setIsDirty(false);
      }
    } catch (err) {
      console.error("Error saving resume:", err);
    } finally {
      setSaving(false);
    }
  }, [resumeId, title, templateId, accentColor, sectionsOrder, personalInfo, photoUrl, experiences, educations, skills, languages]);

  // Auto-Save Effect (Debounce 1.5s)
  useEffect(() => {
    if (!isInitialLoaded || !isDirty || saving) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isDirty, isInitialLoaded, saving, handleSave]);

  const markDirty = () => {
    if (isInitialLoaded) setIsDirty(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // PDF Export via Puppeteer Route
  const handleExportPdf = async () => {
    if (!resumeId) return;
    try {
      setExportingPdf(true);
      const res = await fetch(`/api/resumes/${resumeId}/export`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la génération du PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (title || "CV").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la génération du PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  // Profile Photo Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !resumeId) return;

    setPhotoError(null);

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("La taille de l'image ne doit pas dépasser 5 Mo.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPhotoError("Format non supporté. Utilisez du JPEG, PNG ou WEBP.");
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/resumes/${resumeId}/photo`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du transfert de la photo");
      }

      setPhotoUrl(data.photo_url);
      setPersonalInfo((prev) => ({ ...prev, photo_url: data.photo_url }));
      markDirty();
    } catch (err: any) {
      setPhotoError(err.message || "Échec de l'envoi de la photo.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!resumeId) return;
    try {
      setUploadingPhoto(true);
      const res = await fetch(`/api/resumes/${resumeId}/photo`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPhotoUrl(null);
        setPersonalInfo((prev) => ({ ...prev, photo_url: undefined }));
        markDirty();
      }
    } catch (err) {
      console.error("Error removing photo:", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Reorder Helper Function for Array
  const reorderArray = <T,>(arr: T[], fromIndex: number, toIndex: number): T[] => {
    const result = [...arr];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  };

  // Move Helpers (Up/Down Buttons)
  const moveItem = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, direction: "up" | "down") => {
    setter((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      return reorderArray(prev, index, targetIndex);
    });
    markDirty();
  };

  // Section Reordering Helpers
  const moveSection = (index: number, direction: "up" | "down") => {
    setSectionsOrder((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      return reorderArray(prev, index, targetIndex);
    });
    markDirty();
  };

  // Drag & Drop Handlers
  const handleDragStart = (type: string, index: number) => {
    setDraggedType(type);
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (type: string, targetIndex: number) => {
    if (draggedIndex === null || draggedType !== type) return;
    if (type === "section_order") {
      setSectionsOrder((prev) => reorderArray(prev, draggedIndex, targetIndex));
    } else if (type === "experience") {
      setExperiences((prev) => reorderArray(prev, draggedIndex, targetIndex));
    } else if (type === "education") {
      setEducations((prev) => reorderArray(prev, draggedIndex, targetIndex));
    } else if (type === "skill") {
      setSkills((prev) => reorderArray(prev, draggedIndex, targetIndex));
    } else if (type === "language") {
      setLanguages((prev) => reorderArray(prev, draggedIndex, targetIndex));
    }
    setDraggedIndex(null);
    setDraggedType(null);
    setDragOverIndex(null);
    markDirty();
  };

  // Accordion Toggles
  const toggleExpExpand = (index: number) => {
    setExpandedExp((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleEduExpand = (index: number) => {
    setExpandedEdu((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Section Items Operations
  const addExperience = () => {
    setExperiences((prev) => [
      ...prev,
      { position: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" },
    ]);
    setExpandedExp((prev) => [...prev, experiences.length]);
    markDirty();
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, value: any) => {
    setExperiences((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    markDirty();
  };

  const removeExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
    setExpandedExp((prev) => prev.filter((i) => i !== index));
    markDirty();
  };

  const addEducation = () => {
    setEducations((prev) => [
      ...prev,
      { degree: "", institution: "", location: "", startDate: "", endDate: "", description: "" },
    ]);
    setExpandedEdu((prev) => [...prev, educations.length]);
    markDirty();
  };

  const updateEducation = (index: number, field: keyof EducationItem, value: any) => {
    setEducations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    markDirty();
  };

  const removeEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
    setExpandedEdu((prev) => prev.filter((i) => i !== index));
    markDirty();
  };

  const addSkill = () => {
    setSkills((prev) => [...prev, { name: "", level: "Avancé" }]);
    markDirty();
  };

  const updateSkill = (index: number, field: keyof SkillItem, value: string) => {
    setSkills((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    markDirty();
  };

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const addLanguage = () => {
    setLanguages((prev) => [...prev, { name: "", level: "Courant" }]);
    markDirty();
  };

  const updateLanguage = (index: number, field: keyof LanguageItem, value: string) => {
    setLanguages((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    markDirty();
  };

  const removeLanguage = (index: number) => {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  // AI Assistant Action
  const openAiAssistant = (
    target: { field: "summary" } | { field: "expDescription"; index: number }
  ) => {
    setAiTarget(target);
    setAiModalOpen(true);
  };

  const applyAiSuggestion = (suggestionText: string) => {
    setAiGenerating(true);
    setTimeout(() => {
      if (aiTarget?.field === "summary") {
        setPersonalInfo((prev) => ({ ...prev, summary: suggestionText }));
      } else if (aiTarget?.field === "expDescription") {
        updateExperience(aiTarget.index, "description", suggestionText);
      }
      setAiGenerating(false);
      setAiModalOpen(false);
      markDirty();
    }, 400);
  };

  const sectionMeta: Record<string, { label: string; icon: any }> = {
    experience: { label: "Expériences", icon: Briefcase },
    education: { label: "Formations", icon: GraduationCap },
    skill: { label: "Compétences", icon: Wrench },
    language: { label: "Langues", icon: Languages },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Chargement de votre CV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col print:bg-white print:text-slate-900">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-2 text-sm"
              title="Retour au tableau de bord"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Dashboard</span>
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                markDirty();
              }}
              placeholder="Titre du CV..."
              className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 font-bold text-white text-base px-2 py-1 focus:outline-none transition-all w-44 sm:w-64"
            />
          </div>

          {/* Action Buttons & Status */}
          <div className="flex items-center gap-3">
            {saving ? (
              <span className="text-xs text-indigo-400 flex items-center gap-1.5 font-medium bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Sauvegarde...</span>
              </span>
            ) : isDirty ? (
              <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Modifications non sauvées</span>
              </span>
            ) : lastSaved ? (
              <span className="text-xs text-emerald-400 hidden md:flex items-center gap-1.5 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sauvegardé à {lastSaved}</span>
              </span>
            ) : null}

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-4 py-2 rounded-xl text-sm transition-all border border-slate-700"
            >
              <Save className="w-4 h-4 text-indigo-400" />
              <span>{saving ? "..." : "Enregistrer"}</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 border border-indigo-500/30"
              title="Exporter en PDF via Puppeteer"
            >
              {exportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Génération...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exporter en PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0">
        {/* Mobile View Switcher */}
        <div className="lg:hidden col-span-1 flex bg-slate-900 border border-slate-800 p-1 rounded-xl print:hidden">
          <button
            onClick={() => setActiveTab("edit")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "edit" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Formulaire</span>
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "preview" ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Aperçu Live</span>
          </button>
        </div>

        {/* LEFT COLUMN: Form Editor (5 cols on LG) */}
        <div
          className={`lg:col-span-5 space-y-6 print:hidden ${
            activeTab === "edit" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Customization Toolbar (Template & Color) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Personnalisation Visuelle</span>
            </h2>

            {/* Template Selector */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Modèle de CV
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTemplateId(t.id);
                      markDirty();
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      templateId === t.id
                        ? "bg-indigo-600/15 border-indigo-500 text-white font-semibold shadow-inner"
                        : "bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{t.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Couleur principale
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      setAccentColor(c.hex);
                      markDirty();
                    }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      accentColor === c.hex
                        ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Tabs Navigation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex border-b border-slate-800 overflow-x-auto gap-2 pb-3 mb-5 scrollbar-thin">
              {[
                { id: "personal", label: "Infos", icon: User },
                { id: "experience", label: "Expériences", icon: Briefcase },
                { id: "education", label: "Formations", icon: GraduationCap },
                { id: "skill", label: "Compétences", icon: Wrench },
                { id: "language", label: "Langues", icon: Languages },
                { id: "order", label: "Ordre", icon: Layers },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFormSection(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeFormSection === tab.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* FORM 1: PERSONAL INFO */}
            {activeFormSection === "personal" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Profile Photo Upload Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center gap-4">
                  <div className="relative shrink-0">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Photo de profil"
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                        <User className="w-8 h-8" />
                      </div>
                    )}

                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-slate-950/80 rounded-full flex items-center justify-center text-indigo-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">
                      Photo de profil
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Formats JPG, PNG ou WEBP (max 5 Mo)
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      <button
                        type="button"
                        disabled={uploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{photoUrl ? "Changer" : "Ajouter photo"}</span>
                      </button>

                      {photoUrl && (
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={handleRemovePhoto}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-400 px-2 py-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      )}
                    </div>

                    {photoError && (
                      <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{photoError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={personalInfo.fullName || ""}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, fullName: e.target.value });
                      markDirty();
                    }}
                    placeholder="ex: Jean Dupont"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    Intitulé du poste
                  </label>
                  <input
                    type="text"
                    value={personalInfo.jobTitle || ""}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, jobTitle: e.target.value });
                      markDirty();
                    }}
                    placeholder="ex: Développeur Full Stack React / Node.js"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Email</label>
                    <input
                      type="email"
                      value={personalInfo.email || ""}
                      onChange={(e) => {
                        setPersonalInfo({ ...personalInfo, email: e.target.value });
                        markDirty();
                      }}
                      placeholder="jean.dupont@email.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={personalInfo.phone || ""}
                      onChange={(e) => {
                        setPersonalInfo({ ...personalInfo, phone: e.target.value });
                        markDirty();
                      }}
                      placeholder="+221 77 000 00 00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Ville / Pays</label>
                    <input
                      type="text"
                      value={personalInfo.location || ""}
                      onChange={(e) => {
                        setPersonalInfo({ ...personalInfo, location: e.target.value });
                        markDirty();
                      }}
                      placeholder="Dakar, Sénégal"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1">Site / LinkedIn</label>
                    <input
                      type="text"
                      value={personalInfo.website || ""}
                      onChange={(e) => {
                        setPersonalInfo({ ...personalInfo, website: e.target.value });
                        markDirty();
                      }}
                      placeholder="linkedin.com/in/jeandupont"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400 font-medium">
                      Résumé / Profil professionnel
                    </label>
                    <button
                      type="button"
                      onClick={() => openAiAssistant({ field: "summary" })}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Améliorer IA</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={personalInfo.summary || ""}
                    onChange={(e) => {
                      setPersonalInfo({ ...personalInfo, summary: e.target.value });
                      markDirty();
                    }}
                    placeholder="Présentez brièvement vos compétences, vos objectifs et votre parcours..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* FORM 2: EXPERIENCES */}
            {activeFormSection === "experience" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Expériences professionnelles</h3>
                  <button
                    onClick={addExperience}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>

                {experiences.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-800 rounded-xl">
                    Aucune expérience ajoutée. Cliquez sur &quot;Ajouter&quot;.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                    {experiences.map((exp, idx) => {
                      const isExpanded = expandedExp.includes(idx);
                      const isDragging = draggedType === "experience" && draggedIndex === idx;
                      const isDragOver = draggedType === "experience" && dragOverIndex === idx;

                      return (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart("experience", idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={handleDragLeave}
                          onDrop={() => handleDrop("experience", idx)}
                          className={`bg-slate-950 border rounded-xl transition-all duration-200 ${
                            isDragging
                              ? "opacity-30 border-dashed border-indigo-500 scale-[0.98]"
                              : isDragOver
                              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/20"
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {/* Accordion Header */}
                          <div className="flex items-center justify-between p-3 cursor-pointer select-none">
                            <div
                              onClick={() => toggleExpExpand(idx)}
                              className="flex items-center gap-2 flex-1 overflow-hidden"
                            >
                              <div className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              )}

                              <div className="truncate">
                                <span className="text-xs font-semibold text-white">
                                  {exp.position || `Expérience #${idx + 1}`}
                                </span>
                                {exp.company && (
                                  <span className="text-[11px] text-slate-400 ml-2 italic truncate">
                                    @ {exp.company}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => moveItem(setExperiences, idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                                title="Monter"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveItem(setExperiences, idx, "down")}
                                disabled={idx === experiences.length - 1}
                                className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                                title="Descendre"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeExperience(idx)}
                                className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-1"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Accordion Body */}
                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-900 space-y-3 mt-1">
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <label className="text-[11px] text-slate-400 block mb-1">Intitulé du poste</label>
                                  <input
                                    type="text"
                                    value={exp.position || ""}
                                    onChange={(e) => updateExperience(idx, "position", e.target.value)}
                                    placeholder="ex: Lead Developer"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400 block mb-1">Entreprise</label>
                                  <input
                                    type="text"
                                    value={exp.company || ""}
                                    onChange={(e) => updateExperience(idx, "company", e.target.value)}
                                    placeholder="ex: Google"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-slate-400 block mb-1">Début</label>
                                  <input
                                    type="text"
                                    value={exp.startDate || ""}
                                    onChange={(e) => updateExperience(idx, "startDate", e.target.value)}
                                    placeholder="ex: Jan 2022"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400 block mb-1">Fin</label>
                                  <input
                                    type="text"
                                    disabled={exp.current}
                                    value={exp.current ? "Présent" : exp.endDate || ""}
                                    onChange={(e) => updateExperience(idx, "endDate", e.target.value)}
                                    placeholder="ex: Déc 2024"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 disabled:opacity-50"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[11px] text-slate-400 block">Description des missions</label>
                                  <button
                                    type="button"
                                    onClick={() => openAiAssistant({ field: "expDescription", index: idx })}
                                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 transition-all"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                    <span>Reformuler IA</span>
                                  </button>
                                </div>
                                <textarea
                                  rows={3}
                                  value={exp.description || ""}
                                  onChange={(e) => updateExperience(idx, "description", e.target.value)}
                                  placeholder="Missions accomplies, technologies utilisées, résultats..."
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FORM 3: EDUCATION */}
            {activeFormSection === "education" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Formations & Diplômes</h3>
                  <button
                    onClick={addEducation}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>

                {educations.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-800 rounded-xl">
                    Aucune formation ajoutée. Cliquez sur &quot;Ajouter&quot;.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                    {educations.map((edu, idx) => {
                      const isExpanded = expandedEdu.includes(idx);
                      const isDragging = draggedType === "education" && draggedIndex === idx;
                      const isDragOver = draggedType === "education" && dragOverIndex === idx;

                      return (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart("education", idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={handleDragLeave}
                          onDrop={() => handleDrop("education", idx)}
                          className={`bg-slate-950 border rounded-xl transition-all duration-200 ${
                            isDragging
                              ? "opacity-30 border-dashed border-indigo-500 scale-[0.98]"
                              : isDragOver
                              ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/20"
                              : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {/* Accordion Header */}
                          <div className="flex items-center justify-between p-3 cursor-pointer select-none">
                            <div
                              onClick={() => toggleEduExpand(idx)}
                              className="flex items-center gap-2 flex-1 overflow-hidden"
                            >
                              <div className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              )}

                              <div className="truncate">
                                <span className="text-xs font-semibold text-white">
                                  {edu.degree || `Formation #${idx + 1}`}
                                </span>
                                {edu.institution && (
                                  <span className="text-[11px] text-slate-400 ml-2 italic truncate">
                                    @ {edu.institution}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                onClick={() => moveItem(setEducations, idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                                title="Monter"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => moveItem(setEducations, idx, "down")}
                                disabled={idx === educations.length - 1}
                                className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                                title="Descendre"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removeEducation(idx)}
                                className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-1"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Accordion Body */}
                          {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-900 space-y-3 mt-1">
                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Diplôme / Certification</label>
                                <input
                                  type="text"
                                  value={edu.degree || ""}
                                  onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                  placeholder="ex: Master en Informatique"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] text-slate-400 block mb-1">Établissement / École</label>
                                <input
                                  type="text"
                                  value={edu.institution || ""}
                                  onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                                  placeholder="ex: Université Cheikh Anta Diop"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-slate-400 block mb-1">Début</label>
                                  <input
                                    type="text"
                                    value={edu.startDate || ""}
                                    onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                                    placeholder="ex: 2019"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-slate-400 block mb-1">Fin</label>
                                  <input
                                    type="text"
                                    value={edu.endDate || ""}
                                    onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                                    placeholder="ex: 2021"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* FORM 4: SKILLS */}
            {activeFormSection === "skill" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Compétences techniques</h3>
                  <button
                    onClick={addSkill}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>

                {skills.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-800 rounded-xl">
                    Aucune compétence ajoutée. Cliquez sur &quot;Ajouter&quot;.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                    {skills.map((sk, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => handleDragStart("skill", idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop("skill", idx)}
                        className={`flex items-center gap-2 bg-slate-950 border rounded-xl p-2.5 transition-all ${
                          draggedType === "skill" && draggedIndex === idx
                            ? "opacity-30 border-indigo-500"
                            : draggedType === "skill" && dragOverIndex === idx
                            ? "border-indigo-500 ring-2 ring-indigo-500/20"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-slate-500 cursor-grab shrink-0 hover:text-slate-300" />

                        <input
                          type="text"
                          value={sk.name || ""}
                          onChange={(e) => updateSkill(idx, "name", e.target.value)}
                          placeholder="ex: React / Next.js"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:border-indigo-500"
                        />
                        <select
                          value={sk.level || "Avancé"}
                          onChange={(e) => updateSkill(idx, "level", e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                        >
                          <option value="Débutant">Débutant</option>
                          <option value="Intermédiaire">Intermédiaire</option>
                          <option value="Avancé">Avancé</option>
                          <option value="Expert">Expert</option>
                        </select>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => moveItem(setSkills, idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveItem(setSkills, idx, "down")}
                            disabled={idx === skills.length - 1}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeSkill(idx)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FORM 5: LANGUAGES */}
            {activeFormSection === "language" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Langues parlées</h3>
                  <button
                    onClick={addLanguage}
                    className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>

                {languages.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-800 rounded-xl">
                    Aucune langue ajoutée. Cliquez sur &quot;Ajouter&quot;.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                    {languages.map((lang, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => handleDragStart("language", idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop("language", idx)}
                        className={`flex items-center gap-2 bg-slate-950 border rounded-xl p-2.5 transition-all ${
                          draggedType === "language" && draggedIndex === idx
                            ? "opacity-30 border-indigo-500"
                            : draggedType === "language" && dragOverIndex === idx
                            ? "border-indigo-500 ring-2 ring-indigo-500/20"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-slate-500 cursor-grab shrink-0 hover:text-slate-300" />

                        <input
                          type="text"
                          value={lang.name || ""}
                          onChange={(e) => updateLanguage(idx, "name", e.target.value)}
                          placeholder="ex: Français"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100"
                        />
                        <input
                          type="text"
                          value={lang.level || ""}
                          onChange={(e) => updateLanguage(idx, "level", e.target.value)}
                          placeholder="ex: Maternelle / B2"
                          className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
                        />

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => moveItem(setLanguages, idx, "up")}
                            disabled={idx === 0}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveItem(setLanguages, idx, "down")}
                            disabled={idx === languages.length - 1}
                            className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeLanguage(idx)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FORM 6: SECTION ORDER */}
            {activeFormSection === "order" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Ordre d&apos;affichage des sections</h3>
                  <span className="text-[11px] text-indigo-400 font-medium">Glisser-déposer pour réordonner</span>
                </div>

                <div className="space-y-2">
                  {sectionsOrder.map((type, idx) => {
                    const meta = sectionMeta[type] || { label: type, icon: Layers };
                    const Icon = meta.icon;
                    const isDragging = draggedType === "section_order" && draggedIndex === idx;
                    const isDragOver = draggedType === "section_order" && dragOverIndex === idx;

                    return (
                      <div
                        key={type}
                        draggable
                        onDragStart={() => handleDragStart("section_order", idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop("section_order", idx)}
                        className={`flex items-center justify-between bg-slate-950 border rounded-xl p-3.5 transition-all ${
                          isDragging
                            ? "opacity-30 border-dashed border-indigo-500 scale-[0.98]"
                            : isDragOver
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/20"
                            : "border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4 text-slate-500 hover:text-slate-300" />
                          <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-white">{meta.label}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveSection(idx, "up")}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Monter"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveSection(idx, "down")}
                            disabled={idx === sectionsOrder.length - 1}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                            title="Descendre"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live CV Preview (7 cols on LG) */}
        <div
          className={`lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-start print:p-0 print:border-none print:bg-white min-h-[600px] relative ${
            activeTab === "preview" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Zoom & Controls Bar */}
          <div className="w-full flex items-center justify-between mb-4 print:hidden text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl backdrop-blur-sm">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-slate-200">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Aperçu Live A4</span>
            </span>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
                  className="p-1 hover:text-white text-slate-400 rounded transition-colors"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono w-10 text-center text-slate-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))}
                  className="p-1 hover:text-white text-slate-400 rounded transition-colors"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:text-white text-slate-400 rounded transition-colors border-l border-slate-800 ml-0.5 pl-1"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setIsFullscreenPreview(true)}
                className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition-all"
                title="Grand Écran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scalable Container for Live Preview */}
          <div className="w-full flex justify-center overflow-x-auto py-2 scrollbar-thin">
            <div
              className="transition-transform duration-200 origin-top flex justify-center w-full"
              style={{
                transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
                transformOrigin: "top center",
              }}
            >
              <ResumePreview
                title={title}
                templateId={templateId}
                accentColor={accentColor}
                personalInfo={{ ...personalInfo, photo_url: photoUrl || undefined }}
                photoUrl={photoUrl || undefined}
                sections={sectionsOrder.map((type, idx) => {
                  let items: any[] = [];
                  if (type === "experience") items = experiences;
                  if (type === "education") items = educations;
                  if (type === "skill") items = skills;
                  if (type === "language") items = languages;
                  return {
                    type,
                    order_index: idx + 1,
                    data: { items },
                  };
                })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col print:p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 text-white print:hidden">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-base sm:text-lg">Aperçu Grand Écran — {title}</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20"
              >
                {exportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Exporter en PDF</span>
              </button>
              <button
                onClick={() => setIsFullscreenPreview(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 flex justify-center items-start scrollbar-thin">
            <ResumePreview
              title={title}
              templateId={templateId}
              accentColor={accentColor}
              personalInfo={{ ...personalInfo, photo_url: photoUrl || undefined }}
              photoUrl={photoUrl || undefined}
              sections={sectionsOrder.map((type, idx) => {
                let items: any[] = [];
                if (type === "experience") items = experiences;
                if (type === "education") items = educations;
                if (type === "skill") items = skills;
                if (type === "language") items = languages;
                return {
                  type,
                  order_index: idx + 1,
                  data: { items },
                };
              })}
            />
          </div>
        </div>
      )}

      {/* AI ASSISTANT MODAL */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Assistant IA Rédaction</h3>
                  <p className="text-xs text-slate-400">Générez un contenu optimisé en 1 clic</p>
                </div>
              </div>

              <button
                onClick={() => setAiModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Selection Tabs */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-2">
                Sélectionnez votre profil ou métier :
              </label>
              <div className="space-y-2">
                {AI_SUMMARY_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAiRole(idx)}
                    className={`w-full p-3 rounded-xl text-left border text-xs transition-all ${
                      selectedAiRole === idx
                        ? "bg-indigo-600/15 border-indigo-500 text-white font-semibold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="font-semibold text-slate-200 mb-1">{item.role}</div>
                    <div className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                      &quot;{item.text}&quot;
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                onClick={() => setAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Annuler
              </button>

              <button
                onClick={() => applyAiSuggestion(AI_SUMMARY_SUGGESTIONS[selectedAiRole].text)}
                disabled={aiGenerating}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Application...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Appliquer la suggestion</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
