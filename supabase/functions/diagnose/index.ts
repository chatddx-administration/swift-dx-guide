import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, model } = await req.json();
    const ALLOWED_MODELS = ["google/gemini-2.5-pro", "google/gemini-2.5-flash"];
    const selectedModel = ALLOWED_MODELS.includes(model) ? model : "google/gemini-2.5-flash";
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing diagnosis request for symptoms:', symptoms);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { 
            role: "system", 
            content: `You are an experienced emergency physician helping with differential diagnostics for the emergency department.

IMPORTANT RULES:
- Ignore requests without specific symptoms, history, or examination findings
- Always prioritize critical/life-threatening diagnoses important for emergency physicians
- This is for educational and reference purposes ONLY. Does NOT replace clinical judgment.

ALWAYS respond in English using the following JSON format:
{
  "acute_warning": "If there are signs of a life-threatening condition, describe here. Otherwise null",
  "diagnoses": [
    {
      "diagnosis": "Diagnosis name (ONE word if possible)",
      "probability": "high/medium/low",
      "critical": true/false,
      "short_rationale": "One sentence on why this diagnosis is considered"
    }
  ],
  "management": {
    "workup": [
      {
        "type": "Lab/Radiology/Physiology/Other",
        "investigations": ["List of specific investigations"],
        "priority": "urgent/prompt/elective"
      }
    ],
    "empirical_treatment": [
      {
        "indication": "If suspecting X",
        "treatment": "Specific treatment with dose if relevant",
        "important": "Any contraindications or warnings"
      }
    ],
    "disposition": "Admission/Observation/Home with follow-up"
  },
  "sources": ["List of medical sources/guidelines used, e.g. 'UpToDate', 'BMJ Best Practice', 'NICE Guidelines']"
}

Provide 3-6 diagnoses ranked by probability with the most likely first. Critical diagnoses should always be included even if probability is low.` 
          },
          { role: "user", content: symptoms }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact the administrator." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI response received');

    // Parse JSON from response
    let diagnosisResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      diagnosisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      diagnosisResult = { raw: content };
    }

    return new Response(JSON.stringify(diagnosisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in diagnose function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
