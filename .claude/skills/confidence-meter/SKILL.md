# Confidence Meter

## Purpose
Evaluate documentation completeness by comparing transcript content against generated outputs.

## Input
- Raw transcript
- Generated diary markdown
- Generated defect markdown
- Language (de/en)

## Output
```typescript
interface ConfidenceMeterResult {
  completenessPercentage: number; // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  capturedElements: Array<{
    element: string;
    source: string; // quote from transcript
    captured: boolean;
  }>;
  missingElements: Array<{
    element: string;
    reason: string;
    importance: 'critical' | 'important' | 'optional';
  }>;
  summary: string;
}
```

## Analysis Criteria

### Critical Elements (Must Capture)
- Date and time references
- Location/site information
- Personnel present
- Work performed
- Materials used/delivered
- Weather conditions (if mentioned)
- Safety incidents (if mentioned)

### Important Elements (Should Capture)
- Specific measurements
- Equipment used
- Subcontractor names
- Inspection results
- Client communications
- Schedule impacts

### Optional Elements (Nice to Have)
- Future planning
- Suggestions/recommendations
- Minor observations

## Confidence Level Thresholds
- **High**: 85-100% completeness
- **Medium**: 60-84% completeness
- **Low**: 0-59% completeness

## Prompt Template (Bilingual)

### German
```
Vergleiche das Transkript mit den generierten Berichten.
Identifiziere alle erwähnten Elemente im Transkript.
Prüfe, ob jedes Element in den Berichten erfasst wurde.
Liste fehlende oder unvollständig erfasste Informationen auf.
```

### English
```
Compare the transcript with the generated reports.
Identify all elements mentioned in the transcript.
Check if each element was captured in the reports.
List any missing or incompletely captured information.
```
