"use client";

import React from "react";
import { Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, Wrench, Languages, User } from "lucide-react";

export interface PersonalInfoData {
  fullName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  summary?: string;
  photo_url?: string;
}

export interface ExperienceItem {
  position?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface EducationItem {
  degree?: string;
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface SkillItem {
  name?: string;
  level?: string;
}

export interface LanguageItem {
  name?: string;
  level?: string;
}

export interface ResumeSectionData {
  id?: string;
  type: string; // 'personal' | 'experience' | 'education' | 'skill' | 'language' | 'custom'
  order_index?: number;
  data: any;
}

interface ResumePreviewProps {
  title: string;
  templateId: string;
  accentColor: string;
  personalInfo: PersonalInfoData;
  sections: ResumeSectionData[];
  photoUrl?: string;
}

export function ResumePreview({
  title,
  templateId = "modern",
  accentColor = "#4F46E5",
  personalInfo,
  sections = [],
  photoUrl,
}: ResumePreviewProps) {
  const activePhoto = photoUrl || personalInfo?.photo_url;

  // Sort sections by order_index if present
  const sortedSections = [...sections].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const getSectionData = (type: string) => {
    return sortedSections.find((s) => s.type === type)?.data?.items || [];
  };

  const experiences: ExperienceItem[] = getSectionData("experience");
  const educations: EducationItem[] = getSectionData("education");
  const skills: SkillItem[] = getSectionData("skill");
  const languages: LanguageItem[] = getSectionData("language");

  // RENDER CLASSIC TEMPLATE
  if (templateId === "classic") {
    return (
      <div
        id="cv-print-area"
        className="w-full max-w-[800px] mx-auto bg-white text-slate-800 p-8 sm:p-12 shadow-2xl rounded-sm text-sm print:p-0 print:shadow-none font-serif min-h-[1050px] flex flex-col justify-between"
      >
        <div>
          {/* Header */}
          <div className="text-center border-b-2 pb-6 mb-6" style={{ borderColor: accentColor }}>
            {activePhoto && (
              <img
                src={activePhoto}
                alt={personalInfo.fullName || "Photo de profil"}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-md mx-auto mb-4"
              />
            )}
            <h1 className="text-3xl font-bold tracking-wide uppercase text-slate-900">
              {personalInfo.fullName || "Votre Nom"}
            </h1>
            {personalInfo.jobTitle && (
              <p className="text-base font-medium italic mt-1" style={{ color: accentColor }}>
                {personalInfo.jobTitle}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 mt-3 font-sans">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo.location && <span>• {personalInfo.location}</span>}
              {personalInfo.website && <span>• {personalInfo.website}</span>}
            </div>
          </div>

          {/* Profil */}
          {personalInfo.summary && (
            <div className="mb-6 font-sans">
              <h2
                className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2"
                style={{ color: accentColor, borderColor: accentColor }}
              >
                Profil Professionnel
              </h2>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">{personalInfo.summary}</p>
            </div>
          )}

          {/* Dynamic Section Ordering */}
          {sortedSections.map((sec) => {
            if (sec.type === "experience" && experiences.length > 0) {
              return (
                <div key="experience" className="mb-6 font-sans">
                  <h2
                    className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    Expériences Professionnelles
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline font-semibold text-slate-900 text-xs sm:text-sm">
                          <span>
                            {exp.position} — <span className="font-normal italic">{exp.company}</span>
                          </span>
                          <span className="text-xs text-slate-500 font-normal">
                            {exp.startDate} - {exp.current ? "Présent" : exp.endDate}
                          </span>
                        </div>
                        {exp.location && <div className="text-xs text-slate-400 italic mb-1">{exp.location}</div>}
                        {exp.description && (
                          <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (sec.type === "education" && educations.length > 0) {
              return (
                <div key="education" className="mb-6 font-sans">
                  <h2
                    className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-3"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    Formation
                  </h2>
                  <div className="space-y-3">
                    {educations.map((edu, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline font-semibold text-slate-900 text-xs sm:text-sm">
                          <span>
                            {edu.degree} — <span className="font-normal italic">{edu.institution}</span>
                          </span>
                          <span className="text-xs text-slate-500 font-normal">
                            {edu.startDate} - {edu.endDate}
                          </span>
                        </div>
                        {edu.description && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{edu.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (sec.type === "skill" && skills.length > 0) {
              return (
                <div key="skill" className="mb-6 font-sans">
                  <h2
                    className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    Compétences
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((sk, idx) => (
                      <span key={idx} className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                        {sk.name} {sk.level ? `(${sk.level})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            if (sec.type === "language" && languages.length > 0) {
              return (
                <div key="language" className="mb-6 font-sans">
                  <h2
                    className="text-xs font-bold uppercase tracking-widest border-b pb-1 mb-2"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    Langues
                  </h2>
                  <div className="space-y-1">
                    {languages.map((lang, idx) => (
                      <div key={idx} className="text-xs text-slate-700 flex justify-between max-w-xs">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-slate-500">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  }

  // RENDER MINIMAL TEMPLATE
  if (templateId === "minimal") {
    return (
      <div
        id="cv-print-area"
        className="w-full max-w-[800px] mx-auto bg-white text-slate-800 p-8 sm:p-12 shadow-2xl rounded-sm text-sm print:p-0 print:shadow-none font-sans min-h-[1050px]"
      >
        {/* Header minimal */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light text-slate-900 tracking-tight">
                {personalInfo.fullName || "Votre Nom"}
              </h1>
              <p className="text-sm font-semibold tracking-wider uppercase mt-1" style={{ color: accentColor }}>
                {personalInfo.jobTitle || "Intitulé du poste"}
              </p>
            </div>

            {activePhoto && (
              <img
                src={activePhoto}
                alt={personalInfo.fullName || "Photo de profil"}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-4">
            {personalInfo.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" style={{ color: accentColor }} />
                {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} />
                {personalInfo.phone}
              </span>
            )}
            {personalInfo.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
                {personalInfo.location}
              </span>
            )}
            {personalInfo.website && (
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" style={{ color: accentColor }} />
                {personalInfo.website}
              </span>
            )}
          </div>
        </div>

        {personalInfo.summary && (
          <div className="mb-8">
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed border-l-2 pl-4 py-1" style={{ borderColor: accentColor }}>
              {personalInfo.summary}
            </p>
          </div>
        )}

        {/* Dynamic Sections */}
        {sortedSections.map((sec) => {
          if (sec.type === "experience" && experiences.length > 0) {
            return (
              <div key="experience" className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Expériences</h2>
                <div className="space-y-5">
                  {experiences.map((exp, idx) => (
                    <div key={idx} className="relative pl-4 border-l border-slate-200">
                      <div
                        className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-bold text-slate-900 text-sm">{exp.position}</h3>
                        <span className="text-xs text-slate-400">
                          {exp.startDate} — {exp.current ? "Présent" : exp.endDate}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-600">{exp.company} {exp.location ? `• ${exp.location}` : ""}</div>
                      {exp.description && (
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (sec.type === "education" && educations.length > 0) {
            return (
              <div key="education" className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Formation</h2>
                <div className="space-y-4">
                  {educations.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{edu.degree}</div>
                        <div className="text-xs text-slate-600">{edu.institution}</div>
                        {edu.description && <p className="text-xs text-slate-500 mt-1">{edu.description}</p>}
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {edu.startDate} - {edu.endDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (sec.type === "skill" && skills.length > 0) {
            return (
              <div key="skill" className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Compétences</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium"
                    >
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          if (sec.type === "language" && languages.length > 0) {
            return (
              <div key="language" className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Langues</h2>
                <div className="space-y-1.5 max-w-xs">
                  {languages.map((lang, idx) => (
                    <div key={idx} className="text-xs flex justify-between text-slate-700">
                      <span className="font-medium">{lang.name}</span>
                      <span className="text-slate-400">{lang.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  }

  // RENDER CREATIVE TEMPLATE
  if (templateId === "creative") {
    return (
      <div
        id="cv-print-area"
        className="w-full max-w-[800px] mx-auto bg-white text-slate-800 shadow-2xl rounded-sm text-sm print:p-0 print:shadow-none font-sans min-h-[1050px] overflow-hidden"
      >
        {/* Banner Header */}
        <div className="p-8 sm:p-10 text-white" style={{ backgroundColor: accentColor }}>
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {personalInfo.fullName || "Votre Nom"}
              </h1>
              <p className="text-base font-medium opacity-90 mt-1">
                {personalInfo.jobTitle || "Intitulé du poste"}
              </p>
            </div>

            {activePhoto && (
              <img
                src={activePhoto}
                alt={personalInfo.fullName || "Photo de profil"}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/30 shadow-xl shrink-0"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-xs opacity-85 mt-4 pt-4 border-t border-white/20">
            {personalInfo.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{personalInfo.email}</span>}
            {personalInfo.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{personalInfo.phone}</span>}
            {personalInfo.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{personalInfo.location}</span>}
            {personalInfo.website && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{personalInfo.website}</span>}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          {personalInfo.summary && (
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                À propos de moi
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{personalInfo.summary}</p>
            </div>
          )}

          {/* Dynamic Sections */}
          {sortedSections.map((sec) => {
            if (sec.type === "experience" && experiences.length > 0) {
              return (
                <div key="experience" className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider mb-4 pb-1 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                    Parcours Professionnel
                  </h2>
                  <div className="space-y-5">
                    {experiences.map((exp, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{exp.position}</h3>
                            <p className="text-xs font-medium text-slate-600">{exp.company} {exp.location ? `• ${exp.location}` : ""}</p>
                          </div>
                          <span
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            {exp.startDate} - {exp.current ? "Présent" : exp.endDate}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (sec.type === "education" && educations.length > 0) {
              return (
                <div key="education" className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                    Formations
                  </h2>
                  <div className="space-y-3">
                    {educations.map((edu, idx) => (
                      <div key={idx}>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{edu.degree}</div>
                        <div className="text-xs text-slate-500">{edu.institution} ({edu.startDate} - {edu.endDate})</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (sec.type === "skill" && skills.length > 0) {
              return (
                <div key="skill" className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                    Compétences Clés
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-semibold px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-800"
                      >
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            if (sec.type === "language" && languages.length > 0) {
              return (
                <div key="language" className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b" style={{ color: accentColor, borderColor: accentColor }}>
                    Langues
                  </h2>
                  <div className="space-y-1.5 max-w-xs">
                    {languages.map((lang, idx) => (
                      <div key={idx} className="text-xs flex justify-between text-slate-700">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-slate-400">{lang.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    );
  }

  // DEFAULT TEMPLATE: "modern"
  return (
    <div
      id="cv-print-area"
      className="w-full max-w-[800px] mx-auto bg-white text-slate-800 shadow-2xl rounded-sm text-sm print:p-0 print:shadow-none font-sans min-h-[1050px] grid grid-cols-12 overflow-hidden"
    >
      {/* Sidebar Gauche (35%) */}
      <div className="col-span-12 sm:col-span-4 bg-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between">
        <div>
          {/* Entête Sidebar */}
          <div className="mb-8 border-b border-slate-800 pb-6 text-center sm:text-left">
            {activePhoto ? (
              <img
                src={activePhoto}
                alt={personalInfo.fullName || "Photo de profil"}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-700 shadow-xl mx-auto sm:mx-0 mb-4"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto sm:mx-0 mb-4">
                <User className="w-8 h-8" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
              {personalInfo.fullName || "Votre Nom"}
            </h1>
            <p className="text-xs font-medium mt-1" style={{ color: accentColor }}>
              {personalInfo.jobTitle || "Intitulé du poste"}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3 mb-8 text-xs text-slate-300">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Contact
            </h3>

            {personalInfo.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{personalInfo.website}</span>
              </div>
            )}
          </div>

          {/* Compétences & Langues in sidebar */}
          {skills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Compétences
              </h3>
              <div className="space-y-2">
                {skills.map((sk, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-medium text-slate-200">
                      <span>{sk.name}</span>
                      <span className="text-[10px] text-slate-400">{sk.level}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: accentColor,
                          width:
                            sk.level === "Expert" || sk.level === "Avancé"
                              ? "90%"
                              : sk.level === "Intermédiaire"
                              ? "70%"
                              : "50%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Langues
              </h3>
              <div className="space-y-2">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-200">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-slate-400">{lang.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu Principal Droite (65%) */}
      <div className="col-span-12 sm:col-span-8 p-6 sm:p-8 bg-white flex flex-col justify-between">
        <div>
          {/* Résumé / Profil */}
          {personalInfo.summary && (
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: accentColor }} />
                <span>Profil</span>
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{personalInfo.summary}</p>
            </div>
          )}

          {/* Dynamic Order for Experience and Education */}
          {sortedSections.map((sec) => {
            if (sec.type === "experience" && experiences.length > 0) {
              return (
                <div key="experience" className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2 border-b pb-2" style={{ borderColor: accentColor }}>
                    <Briefcase className="w-4 h-4" style={{ color: accentColor }} />
                    <span>Expériences Professionnelles</span>
                  </h2>

                  <div className="space-y-5">
                    {experiences.map((exp, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-slate-900 text-sm">{exp.position}</h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {exp.startDate} - {exp.current ? "Présent" : exp.endDate}
                          </span>
                        </div>

                        <div className="text-xs font-semibold mt-0.5" style={{ color: accentColor }}>
                          {exp.company} {exp.location ? `• ${exp.location}` : ""}
                        </div>

                        {exp.description && (
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (sec.type === "education" && educations.length > 0) {
              return (
                <div key="education" className="mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2 border-b pb-2" style={{ borderColor: accentColor }}>
                    <GraduationCap className="w-4 h-4" style={{ color: accentColor }} />
                    <span>Formation</span>
                  </h2>

                  <div className="space-y-4">
                    {educations.map((edu, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-bold text-slate-900 text-sm">{edu.degree}</h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {edu.startDate} - {edu.endDate}
                          </span>
                        </div>

                        <div className="text-xs font-semibold mt-0.5" style={{ color: accentColor }}>
                          {edu.institution} {edu.location ? `• ${edu.location}` : ""}
                        </div>

                        {edu.description && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{edu.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
