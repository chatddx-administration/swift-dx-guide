import { FileText, ListChecks, ShieldAlert, BookOpen, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DiagnosisCard } from "./DiagnosisCard";
import { ManagementSection } from "./ManagementSection";

// Map common medical sources to their URLs
const sourceUrlMap: Record<string, string> = {
  "uptodate": "https://www.uptodate.com",
  "bmj best practice": "https://bestpractice.bmj.com",
  "bmj": "https://www.bmj.com",
  "nice": "https://www.nice.org.uk",
  "nice guidelines": "https://www.nice.org.uk/guidance",
  "cdc": "https://www.cdc.gov",
  "who": "https://www.who.int",
  "medscape": "https://www.medscape.com",
  "pubmed": "https://pubmed.ncbi.nlm.nih.gov",
  "cochrane": "https://www.cochranelibrary.com",
  "lancet": "https://www.thelancet.com",
  "nejm": "https://www.nejm.org",
  "ahrq": "https://www.ahrq.gov",
  "acep": "https://www.acep.org",
  "esc": "https://www.escardio.org",
  "aha": "https://www.heart.org",
  "ers": "https://www.ersnet.org",
  "ats": "https://www.thoracic.org",
};

function getSourceUrl(source: string): string | null {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return source;
  }
  
  const normalized = source.toLowerCase().trim();
  
  for (const [key, url] of Object.entries(sourceUrlMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return url;
    }
  }
  
  return null;
}

interface Diagnosis {
  diagnosis: string;
  probability: "high" | "medium" | "low";
  critical?: boolean;
  short_rationale?: string;
  description?: string;
  red_flags?: string[];
  workup?: string[];
}

interface Workup {
  type: string;
  investigations: string[];
  priority: "urgent" | "prompt" | "elective";
}

interface Treatment {
  indication: string;
  treatment: string;
  important?: string;
}

interface Management {
  workup?: Workup[];
  empirical_treatment?: Treatment[];
  disposition?: string;
}

interface DiagnosisResult {
  diagnoses?: Diagnosis[];
  acute_warning?: string | null;
  summary?: string;
  management?: Management;
  sources?: string[];
  raw?: string;
}

interface DiagnosisResultsProps {
  results: DiagnosisResult;
}

export function DiagnosisResults({ results }: DiagnosisResultsProps) {
  if (results.raw) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <p className="text-muted-foreground whitespace-pre-wrap">{results.raw}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Acute warning first */}
      {results.acute_warning && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 rounded-2xl animate-scale-in">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="font-display font-bold text-lg">Acute warning</AlertTitle>
          <AlertDescription className="mt-2 text-destructive/90">
            {results.acute_warning}
          </AlertDescription>
        </Alert>
      )}

      {/* Differential diagnoses */}
      {results.diagnoses && results.diagnoses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="p-2 rounded-xl bg-primary/10">
              <ListChecks className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-xl text-foreground">
              Differential diagnoses
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {results.diagnoses.length}
            </span>
          </div>
          <div className="space-y-3">
            {results.diagnoses.map((diagnosis, index) => (
              <DiagnosisCard key={index} diagnosis={diagnosis} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Management */}
      {results.management && (
        <ManagementSection management={results.management} />
      )}

      {/* Sources */}
      {results.sources && results.sources.length > 0 && (
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-accent/10 flex-shrink-0">
              <BookOpen className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-foreground mb-3">Medical sources</h3>
              <div className="flex flex-wrap gap-2">
                {results.sources.map((source, index) => {
                  const url = getSourceUrl(source);
                  if (url) {
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                        className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {source}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    );
                  }
                  return (
                    <span 
                      key={index}
                      className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm"
                    >
                      {source}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy summary for backwards compatibility */}
      {results.summary && !results.management && (
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-accent/10 flex-shrink-0">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground mb-2">Summary</h3>
              <p className="text-muted-foreground leading-relaxed">{results.summary}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-6 border-t border-border/30 animate-fade-in">
        This information is for educational and reference purposes only and does not replace clinical judgment.
      </p>
    </div>
  );
}
