import { useState } from "react";
import { Send, Stethoscope, Loader2, AlertTriangle, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DiagnosisResults } from "@/components/DiagnosisResults";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MODEL_OPTIONS = [
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const Index = () => {
  const [symptoms, setSymptoms] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [model, setModel] = useState<string>("google/gemini-2.5-flash");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symptoms.trim()) {
      toast.error("Enter symptoms to get differential diagnosis suggestions");
      return;
    }

    setIsLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("diagnose", {
        body: { symptoms: symptoms.trim() },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data);
    } catch (error: any) {
      console.error("Diagnosis error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl floating" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl floating" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-4xl py-10 px-4 sm:py-16 relative z-10">
        {/* Header */}
        <header className="text-center mb-10 sm:mb-14 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mb-6 glow-primary">
            <Stethoscope className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight">
            <span className="gradient-text">Emergency</span>{" "}
            <span className="text-foreground">Differential Diagnostics</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Describe the patient's symptoms and history for AI-based differential diagnosis suggestions
          </p>
        </header>

        {/* Disclaimer */}
        <Alert className="mb-8 glass-card border-warning/20 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertDescription className="text-sm text-muted-foreground ml-2">
            <strong className="text-foreground font-semibold">Important:</strong> This tool is for educational and reference purposes only. 
            It does not replace clinical judgment or medical consultation.
          </AlertDescription>
        </Alert>

        {/* Input Form */}
        <Card className="mb-8 glass-card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display text-xl">Symptoms & History</CardTitle>
                <CardDescription className="mt-1">
                  Describe current symptoms, duration, severity, and relevant medical history
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Example: 65-year-old man with sudden chest pain for 2 hours, radiating to the left arm, nausea, cold sweats. History of hypertension and type 2 diabetes. Smokes 20 cigarettes/day."
                  className="min-h-[160px] resize-y text-base leading-relaxed bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading || !symptoms.trim()}
                  size="lg"
                  className="gap-2 font-semibold px-6 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze symptoms
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="animate-scale-in">
            <DiagnosisResults results={results} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;