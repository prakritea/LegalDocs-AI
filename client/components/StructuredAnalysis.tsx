import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ParsedAnalysis, parseLLMSummary } from "@/utils/structuredParser";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { 
  FileText, ShieldAlert, Clock, BarChart3, ChevronDown, ChevronRight,
  Zap, Info, ListChecks, Target, CheckCircle2, AlertTriangle, Lightbulb, ExternalLink,
  ClipboardList, Activity, Eye, Calendar, Book, Network, Share2, Users, ArrowRight
} from "lucide-react";
import { SourceReference } from "@shared/api";
import { cn } from "@/lib/utils";

import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";

interface StructuredAnalysisProps {
  rawMarkdown: string;
  sourceReferences?: SourceReference[];
}

export const StructuredAnalysis: React.FC<StructuredAnalysisProps> = ({ rawMarkdown, sourceReferences = [] }) => {
  const data = parseLLMSummary(rawMarkdown);
  const [expandedSection, setExpandedSection] = useState<string | null>('executive');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  const getRiskColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('critical')) return 'bg-red-500/10 text-red-500 border-red-500/20';
    if (l.includes('high')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    if (l.includes('medium')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-green-500/10 text-green-500 border-green-500/20';
  };

  const getUrgencyColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('immediate')) return 'text-red-500';
    if (l.includes('high')) return 'text-orange-500';
    if (l.includes('medium')) return 'text-yellow-500';
    return 'text-green-500';
  };

  const AccordionSection = ({ id, icon: Icon, title, children }: any) => {
    const isExpanded = expandedSection === id;
    return (
      <Card className="mb-4 border-zinc-800 bg-zinc-950/50 overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md">
        <button 
          onClick={() => setExpandedSection(isExpanded ? null : id)}
          className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isExpanded ? 'bg-brand-900/30 text-brand-400' : 'bg-zinc-900 text-zinc-400'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
          </div>
          {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-500" /> : <ChevronRight className="w-5 h-5 text-zinc-500" />}
        </button>
        {isExpanded && (
          <div className="p-4 pt-0 border-t border-zinc-800/50">
            {children}
          </div>
        )}
      </Card>
    );
  };

  const confidenceValue = parseInt(data.classification.confidenceScore.replace(/[^0-9]/g, '')) || 85;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
      
      {/* 1. TOP DASHBOARD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Document Type", value: data.classification.documentType, icon: FileText, color: "blue" },
          { label: "Legal Relevance", value: data.classification.relevanceScore, icon: Target, color: "emerald" },
          { label: "Risk Rating", value: data.finalAssessment.overallRisk, icon: ShieldAlert, color: data.finalAssessment.overallRisk.toLowerCase().includes('high') ? 'red' : 'green' },
          { label: "Urgency", value: data.classification.urgencyLevel || "Low", icon: Clock, color: "purple" }
        ].map((item, idx) => (
          <Card key={idx} className="bg-zinc-950 border-zinc-800 shadow-lg hover:border-zinc-700 transition-colors">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className={cn(
                "p-3 rounded-xl",
                item.color === 'blue' && "bg-blue-500/10 text-blue-500",
                item.color === 'emerald' && "bg-emerald-500/10 text-emerald-500",
                item.color === 'red' && "bg-red-500/10 text-red-500",
                item.color === 'green' && "bg-green-500/10 text-green-500",
                item.color === 'purple' && "bg-purple-500/10 text-purple-500",
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{item.label}</p>
                <h4 className={cn(
                  "text-lg font-bold text-white mt-0.5",
                  item.label === "Urgency" && getUrgencyColor(item.value)
                )}>{item.value}</h4>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="h-[800px] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950">
        <ResizablePanelGroup direction="horizontal">
          {/* LEFT PANEL: ANALYSIS CONTENT */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <ScrollArea className="h-full bg-zinc-950">
              <div className="p-6 space-y-4">
                <AccordionSection id="executive" icon={ClipboardList} title="Executive Summary">
                  <div className="space-y-4 mt-4">
                    {data.executiveSummary.map((item, i) => {
                      const parts = item.split(':');
                      const hasLabel = parts.length > 1 && parts[0].length < 30;
                      return (
                        <div key={i} className="group relative flex items-start bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/50 hover:border-brand-500/30 hover:bg-zinc-900/60 transition-all duration-200">
                          <div className="mr-4 mt-1.5 w-2.5 h-2.5 rounded-full bg-brand-500/80 shadow-[0_0_10px_rgba(59,130,246,0.5)] flex-shrink-0" />
                          <div className="flex-1">
                            {hasLabel ? (
                              <p className="text-zinc-200 text-base leading-relaxed">
                                <strong className="text-brand-400 font-bold mr-1">{parts[0]}:</strong>
                                {parts.slice(1).join(':')}
                              </p>
                            ) : (
                              <p className="text-zinc-200 text-base leading-relaxed">{item}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {data.executiveSummary.length === 0 && (
                      <div className="p-8 text-center bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                        <p className="text-zinc-500 italic">No summary points extracted.</p>
                      </div>
                    )}
                  </div>
                </AccordionSection>

                <AccordionSection id="clauses" icon={FileText} title="Key Clauses & Obligations">
                  <div className="grid gap-4 mt-4">
                    {data.keyClauses.map((clause, i) => (
                      <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
                        <h4 className="font-bold text-white mb-2 flex items-center">
                          <div className="w-1 h-4 bg-brand-500 rounded-full mr-2" />
                          {clause.title}
                        </h4>
                        <p className="text-zinc-400 text-sm leading-relaxed">{clause.summary}</p>
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection id="risks" icon={AlertTriangle} title="Legal Risk Analysis">
                  <div className="space-y-4 mt-4">
                    {data.risks.map((risk, i) => (
                      <div key={i} className="flex gap-4 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center border",
                            getRiskColor(risk.riskLevel).replace('bg-', 'border-').replace('/10', '/30')
                          )}>
                             <ShieldAlert className={cn("w-6 h-6", getRiskColor(risk.riskLevel).split(' ')[1])} />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                               <Badge className={getRiskColor(risk.riskLevel)} variant="outline">{risk.riskLevel}</Badge>
                               <span className="text-zinc-500 text-[10px] uppercase tracking-tighter font-bold">Severity Score</span>
                            </div>
                            {risk.score && (
                              <div className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[10px] font-mono text-brand-400">
                                {risk.score}/10
                              </div>
                            )}
                          </div>
                          <p className="text-zinc-200 text-sm leading-relaxed">{risk.explanation}</p>
                          {risk.mitigation && (
                            <div className="p-3 bg-brand-500/5 rounded-lg border border-brand-500/20">
                               <p className="text-brand-400 text-xs font-bold uppercase mb-1">Proposed Mitigation</p>
                               <p className="text-brand-300 text-sm italic">{risk.mitigation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection id="sources" icon={ExternalLink} title={`Page (${data.pages.length})`}>
                  <div className="space-y-4 mt-4">
                    {data.pages.map((page, index) => (
                      <button 
                        key={index} 
                        onClick={() => setSelectedPage(page.pageNumber)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border transition-all duration-200",
                          selectedPage === page.pageNumber 
                            ? "bg-brand-900/20 border-brand-500/50 ring-1 ring-brand-500/20" 
                            : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-brand-400 font-mono text-[10px]">
                            PAGE {page.pageNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-zinc-300 border-l-2 border-brand-500/30 pl-3 leading-relaxed">
                          {page.summary}
                        </p>
                      </button>
                    ))}
                    {data.pages.length === 0 && (
                      <p className="p-8 text-center text-zinc-500 italic bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                        No page-by-page analysis available.
                      </p>
                    )}
                  </div>
                </AccordionSection>
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-zinc-800 w-1" />

          {/* RIGHT PANEL: INSIGHTS & DOCUMENT VIEWER */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <ScrollArea className="h-full bg-zinc-950 border-l border-zinc-800">
              <div className="p-6 space-y-6">
                
                {/* AI INSIGHTS PANEL */}
                <Card className="bg-zinc-950 border-zinc-800 shadow-inner">
                  <CardHeader className="pb-3 border-b border-zinc-900">
                    <CardTitle className="text-sm font-bold flex items-center text-white uppercase tracking-widest">
                      <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                      Document Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500 tracking-tighter">
                        <span>AI Confidence</span>
                        <span className="text-brand-400">{confidenceValue}%</span>
                      </div>
                      <Progress value={confidenceValue} className="h-1 bg-zinc-900" />
                    </div>

                    <div className="space-y-3">
                      {data.actionableInsights.map((insight, i) => (
                        <div key={i} className="flex gap-3 text-sm text-zinc-300 items-start">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs leading-relaxed">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* ADVANCED INTELLIGENCE PANELS */}
                <Tabs defaultValue="timeline" className="w-full">
                  <TabsList className="w-full grid grid-cols-3 bg-zinc-900/50 border border-zinc-800 p-1 h-auto shrink-0 mb-4">
                    <TabsTrigger value="timeline" className="py-2 text-[10px] font-bold uppercase tracking-tighter data-[state=active]:bg-brand-600 data-[state=active]:text-white transition-all">
                      <Calendar className="w-3 h-3 mr-1.5" /> Timeline
                    </TabsTrigger>
                    <TabsTrigger value="definitions" className="py-2 text-[10px] font-bold uppercase tracking-tighter data-[state=active]:bg-brand-600 data-[state=active]:text-white transition-all">
                      <Book className="w-3 h-3 mr-1.5" /> Definitions
                    </TabsTrigger>
                    <TabsTrigger value="relationships" className="py-2 text-[10px] font-bold uppercase tracking-tighter data-[state=active]:bg-brand-600 data-[state=active]:text-white transition-all">
                      <Share2 className="w-3 h-3 mr-1.5" /> Net Map
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <Card className="bg-zinc-950 border-zinc-800 shadow-inner overflow-hidden">
                      <CardHeader className="pb-3 border-b border-zinc-900 bg-zinc-900/10">
                        <CardTitle className="text-[10px] font-bold flex items-center text-zinc-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3 mr-2 text-brand-500" />
                          Document Chronology
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="relative border-l border-zinc-800 ml-2 space-y-6 py-2">
                          {data.timeline.length > 0 ? data.timeline.map((item, i) => (
                            <div key={i} className="relative pl-6 group">
                              <div className={cn(
                                "absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-zinc-950 transition-colors",
                                item.importance.toLowerCase() === 'high' ? "bg-red-500" : "bg-brand-500"
                              )} />
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-brand-400 font-mono tracking-wider">{item.date}</span>
                                <span className="text-xs text-zinc-300 leading-relaxed font-medium group-hover:text-white transition-colors">{item.event}</span>
                                <Badge variant="outline" className="w-fit text-[8px] py-0 h-4 bg-zinc-900 border-zinc-800 uppercase text-zinc-500">
                                  {item.importance} Priority
                                </Badge>
                              </div>
                            </div>
                          )) : (
                            <div className="p-8 text-center text-zinc-600 italic text-[10px]">No chronological events detected.</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="definitions" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <Card className="bg-zinc-950 border-zinc-800 shadow-inner overflow-hidden">
                      <CardHeader className="pb-3 border-b border-zinc-900 bg-zinc-900/10">
                        <CardTitle className="text-[10px] font-bold flex items-center text-zinc-400 uppercase tracking-widest">
                          <Book className="w-3 h-3 mr-2 text-brand-500" />
                          Terminological Glossary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                          <div className="divide-y divide-zinc-900">
                            {data.definitions.length > 0 ? data.definitions.map((def, i) => (
                              <div key={i} className="p-4 hover:bg-zinc-900/30 transition-colors cursor-default">
                                <h5 className="text-xs font-bold text-brand-400 mb-1">{def.term}</h5>
                                <p className="text-[11px] text-zinc-400 leading-normal">{def.definition}</p>
                              </div>
                            )) : (
                              <div className="p-12 text-center text-zinc-600 italic text-[10px]">No formal definitions detected.</div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="relationships" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <Card className="bg-zinc-950 border-zinc-800 shadow-inner overflow-hidden">
                      <CardHeader className="pb-3 border-b border-zinc-900 bg-zinc-900/10">
                        <CardTitle className="text-[10px] font-bold flex items-center text-zinc-400 uppercase tracking-widest">
                          <Network className="w-3 h-3 mr-2 text-brand-500" />
                          Entity Relationship Map
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {data.relationships.length > 0 ? data.relationships.map((rel, i) => (
                            <div key={i} className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800 flex items-center gap-4 group hover:border-brand-500/30 transition-all">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-brand-500/20 transition-colors">
                                <Users className="w-3 h-3 text-zinc-400 group-hover:text-brand-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-zinc-300 leading-tight mb-1">{rel.relationship}</p>
                                <Badge className="text-[8px] bg-brand-500/10 text-brand-400 hover:bg-brand-500/10 border-brand-500/20 uppercase tracking-tighter">
                                  {rel.type}
                                </Badge>
                              </div>
                            </div>
                          )) : (
                            <div className="p-12 text-center text-zinc-600 italic text-[10px]">No complex connections detected.</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* ENTITIES LIST */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center">
                    <Info className="w-3 h-3 mr-2" />
                    Key Entities
                  </h4>
                  <div className="space-y-3">
                    {data.entities.map((ent, i) => (
                      <div key={i} className="p-3 bg-zinc-900/30 rounded-lg border border-zinc-800">
                        <p className="text-[10px] font-bold text-brand-400 uppercase mb-2 tracking-widest">{ent.category}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ent.items.map((item, j) => (
                            <Badge key={j} variant="secondary" className="bg-zinc-900 text-zinc-300 border-zinc-800 font-medium text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PROCESSING PIPELINE */}
                <div className="pb-8">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center mb-4">
                    <Activity className="w-3 h-3 mr-2" />
                    Analysis Pipeline
                  </h4>
                  <div className="space-y-3 pl-2 border-l border-zinc-800">
                    {[
                      { step: "Document OCR & Parsing", status: "complete" },
                      { step: "Semantic Relationship Mapping", status: "complete" },
                      { step: "Legal Intent Extraction", status: "complete" },
                      { step: "Risk Exposure Assessment", status: "complete" }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center text-[10px] group">
                        <div className="relative -left-[9px] w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center mr-3 ring-4 ring-zinc-950">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </div>
                        <span className="text-zinc-400 group-hover:text-brand-400 transition-colors uppercase tracking-tight">{step.step}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};
