# Claim Safety Layer

## Purpose
Semantic risk classification and neutral rewriting for construction documentation.

## Input
- Diary markdown (Tagesbericht)
- Defect markdown (Mängelbericht)
- Language (de/en)

## Output
```typescript
interface ClaimSafetyResult {
  riskLevel: 'safe' | 'caution' | 'risky';
  riskPercentage: number; // 0-100, higher = more risky
  overallSafetyScore: number; // 0-100, higher = safer
  problematicPhrases: Array<{
    original: string;
    issue: string;
    suggestedRewrite: string;
    riskContribution: number;
  }>;
  summary: string;
}
```

## Analysis Criteria

### High Risk Indicators
- Admission of fault or liability ("our mistake", "we failed to")
- Absolute statements ("always", "never", "completely")
- Emotional language ("terrible", "unacceptable", "disaster")
- Unclear responsibility attribution
- Missing documentation references

### Medium Risk Indicators
- Vague timeline references
- Ambiguous responsibility statements
- Technical inaccuracies
- Missing witness/photo references

### Low Risk/Safe Indicators
- Objective factual descriptions
- Clear date/time stamps
- Referenced documentation
- Neutral professional language
- Clear responsibility attribution

## Prompt Template (Bilingual)

### German
```
Analysiere den folgenden Baustellenbericht auf rechtliche Risiken und problematische Formulierungen.
Identifiziere Aussagen, die bei einem Rechtsstreit problematisch sein könnten.
Für jede problematische Phrase, schlage eine neutrale Umformulierung vor.
```

### English
```
Analyze the following construction site report for legal risks and problematic phrasing.
Identify statements that could be problematic in case of legal disputes.
For each problematic phrase, suggest a neutral rewrite.
```
