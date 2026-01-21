# Delta Intelligence

## Purpose
Temporal reasoning to compare current entry against previous entries from the same project.

## Input
- Current transcript
- Current diary markdown
- Current defect markdown
- Previous entries (array of VoiceEntry from same project)
- Language (de/en)

## Output
```typescript
interface DeltaIntelligenceResult {
  newItems: Array<{
    item: string;
    category: 'work' | 'defect' | 'material' | 'personnel' | 'other';
    significance: 'major' | 'minor';
  }>;
  resolvedItems: Array<{
    item: string;
    previousMention: string; // date or entry reference
    resolution: string;
  }>;
  recurringIssues: Array<{
    issue: string;
    occurrences: number;
    trend: 'improving' | 'stable' | 'worsening';
    firstMention: string;
  }>;
  progressSummary: string;
  comparisonPeriod: {
    currentDate: string;
    previousEntriesCount: number;
    dateRange: string;
  };
}
```

## Analysis Categories

### New Items
- Work activities not seen in previous entries
- New defects or issues identified
- New materials or equipment mentioned
- New personnel or trades on site

### Resolved Items
- Defects that were mentioned before but now reported as fixed
- Work items that were pending and now completed
- Issues that have been addressed

### Recurring Issues
- Problems mentioned in multiple entries
- Persistent defects
- Repeated delays or blockers

## Trend Analysis
- **Improving**: Issue mentions decreasing, resolutions increasing
- **Stable**: Consistent mentions without significant change
- **Worsening**: Issue mentions increasing, no resolutions

## Prompt Template (Bilingual)

### German
```
Vergleiche den aktuellen Eintrag mit den vorherigen Einträgen desselben Projekts.
Identifiziere:
1. Neue Elemente, die vorher nicht erwähnt wurden
2. Gelöste Probleme, die vorher offen waren
3. Wiederkehrende Themen oder Probleme
Erstelle eine Fortschrittszusammenfassung.
```

### English
```
Compare the current entry with previous entries from the same project.
Identify:
1. New elements that weren't mentioned before
2. Resolved issues that were previously open
3. Recurring themes or problems
Create a progress summary.
```

## Edge Cases
- No previous entries: Return empty arrays with helpful message in progressSummary
- Single previous entry: Limited trend analysis, focus on direct comparison
- Many previous entries (>10): Focus on most recent 5-10 for relevance
