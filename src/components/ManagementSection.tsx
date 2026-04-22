import { Beaker, Pill, ArrowRight } from "lucide-react";

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

interface ManagementSectionProps {
  management: Management;
}

// Lab grouping patterns (English lab names)
const labGroups: { name: string; patterns: RegExp[] }[] = [
  { name: "Complete blood count", patterns: [/^cbc$/i, /^fbc$/i, /^hb$/i, /hemoglobin/i, /haemoglobin/i, /wbc/i, /platelet/i, /leukocyt/i, /erythrocyt/i, /hematocrit/i, /haematocrit/i, /^mcv$/i, /^mch$/i, /diff/i] },
  { name: "Electrolytes", patterns: [/sodium/i, /potassium/i, /calcium/i, /magnesium/i, /chloride/i, /phosphate/i, /^na\+?$/i, /^k\+?$/i, /^ca\+?$/i, /^mg\+?$/i, /electrolyte/i] },
  { name: "Renal function", patterns: [/creatinine/i, /urea/i, /bun/i, /egfr/i, /cystatin/i] },
  { name: "Liver function", patterns: [/^alt$/i, /^ast$/i, /^alp$/i, /^ggt$/i, /bilirubin/i, /^ldh$/i, /albumin/i, /\blft\b/i, /liver/i] },
  { name: "Inflammatory markers", patterns: [/^crp$/i, /procalcitonin/i, /^pct$/i, /^esr$/i, /sed.*rate/i] },
  { name: "Coagulation", patterns: [/^pt$/i, /^inr$/i, /^aptt$/i, /^ptt$/i, /fibrinogen/i, /d-dimer/i, /coagulat/i] },
  { name: "Cardiac markers", patterns: [/troponin/i, /^tnt$/i, /^tni$/i, /^bnp$/i, /nt-probnp/i, /ck-mb/i, /myoglobin/i] },
  { name: "Glucose/Metabolism", patterns: [/glucose/i, /hba1c/i, /lactate/i, /blood sugar/i] },
  { name: "Blood gas", patterns: [/blood gas/i, /\babg\b/i, /\bvbg\b/i, /^ph$/i, /pco2/i, /po2/i, /\bbe\b/i, /bicarbonate/i] },
  { name: "Thyroid", patterns: [/^tsh$/i, /^t3$/i, /^t4$/i, /free.*t4/i, /thyroid/i] },
];

function groupLabTests(investigations: string[]): { grouped: { [key: string]: string[] }; ungrouped: string[] } {
  const grouped: { [key: string]: string[] } = {};
  const ungrouped: string[] = [];
  const assigned = new Set<number>();

  investigations.forEach((item, index) => {
    for (const group of labGroups) {
      if (group.patterns.some(pattern => pattern.test(item))) {
        if (!grouped[group.name]) {
          grouped[group.name] = [];
        }
        grouped[group.name].push(item);
        assigned.add(index);
        return;
      }
    }
  });

  investigations.forEach((item, index) => {
    if (!assigned.has(index)) {
      ungrouped.push(item);
    }
  });

  return { grouped, ungrouped };
}

export function ManagementSection({ management }: ManagementSectionProps) {
  return (
    <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/10">
          <ArrowRight className="w-5 h-5 text-accent" />
        </div>
        <h3 className="font-display font-bold text-xl text-foreground">
          Management
        </h3>
      </div>

      {/* Workup */}
      {management.workup && management.workup.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Beaker className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-display font-semibold text-lg text-foreground">Workup</h4>
          </div>
          
          <div className="text-sm space-y-4">
              {management.workup.map((item, index) => {
                const isLab = item.type.toLowerCase().includes('lab');
                const { grouped, ungrouped } = isLab 
                  ? groupLabTests(item.investigations) 
                  : { grouped: {}, ungrouped: item.investigations };
                const groupKeys = Object.keys(grouped);
                
                return (
                  <div key={index}>
                    <div className="mb-1">
                      <span className="font-semibold text-foreground">{item.type}</span>
                    </div>
                    
                    {isLab && groupKeys.length > 0 ? (
                      <div className="space-y-0.5">
                        {groupKeys.map((groupName) => (
                          <p key={groupName} className="text-muted-foreground">
                            <span className="font-medium text-foreground">{groupName}:</span>{' '}
                            {grouped[groupName].join(', ')}
                          </p>
                        ))}
                        {ungrouped.length > 0 && (
                          <p className="text-muted-foreground">{ungrouped.join(', ')}</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {item.investigations.map((investigation, i) => (
                          <p key={i} className="text-muted-foreground">{investigation}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empirical treatment */}
      {management.empirical_treatment && management.empirical_treatment.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10">
              <Pill className="w-5 h-5 text-accent" />
            </div>
            <h4 className="font-display font-semibold text-lg text-foreground">Empirical treatment</h4>
          </div>
          
          <div className="text-sm space-y-1">
            {management.empirical_treatment.map((treatment, index) => (
              <div key={index}>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{treatment.indication}:</span>{' '}
                  {treatment.treatment}
                  {treatment.important && (
                    <span className="text-warning ml-1">⚠ {treatment.important}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disposition */}
      {management.disposition && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-2">Disposition</h4>
              <p className="text-muted-foreground">{management.disposition}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
