# Smart Insights Test Cases

This document provides sample transcripts and expected outputs for testing the Smart Insights features.

---

## Test Case 1: Claim Safety - Risky Documentation

### Input Transcript (German)
```
Heute auf der Baustelle. Die Elektriker haben komplett versagt mit der Installation.
Das war definitiv unser Fehler, wir hätten das früher kontrollieren müssen.
Der Bauleiter hat gesagt, sowas passiert nie wieder. Die Arbeit war unakzeptabel schlecht.
Die Installateure waren den ganzen Tag da und haben nichts geschafft.
```

### Expected Claim Safety Output
- **Risk Level**: `risky`
- **Risk Percentage**: ~70-85%
- **Overall Safety Score**: ~15-30%
- **Problematic Phrases**:
  1. "komplett versagt" → "hatten Schwierigkeiten bei der Installation"
  2. "definitiv unser Fehler" → "es wurden Verbesserungsmöglichkeiten identifiziert"
  3. "nie wieder" → "zukünftig vermieden werden soll"
  4. "unakzeptabel schlecht" → "entsprach nicht den Erwartungen"

---

## Test Case 2: Claim Safety - Safe Documentation

### Input Transcript (English)
```
On-site today. Electrical team completed Phase 2 wiring according to specifications.
Materials delivered at 9 AM, documented in delivery note #DL-2024-0145.
Minor delay due to weather conditions, documented with photos.
Next: Continue with Phase 3 pending inspection approval.
```

### Expected Claim Safety Output
- **Risk Level**: `safe`
- **Risk Percentage**: ~0-15%
- **Overall Safety Score**: ~85-100%
- **Problematic Phrases**: Empty or minimal suggestions

---

## Test Case 3: Confidence Meter - High Completeness

### Input Transcript
```
Datum: 15. Januar 2024, 8 Uhr morgens.
Baustelle Musterstraße 42, Gebäude A.
Anwesend: Elektriker Firma Müller, 3 Personen. Rohbauer Schmidt, 5 Personen.
Wetter: Bewölkt, 8 Grad.
Arbeiten: Elektroleitungen im 2. OG verlegt. Betonarbeiten im EG abgeschlossen.
Material: 500m Kabel geliefert von Elektro-Großhandel.
Keine besonderen Vorkommnisse.
Nächste Schritte: Morgen Fortsetzung Elektro im 3. OG.
```

### Expected Confidence Meter Output
- **Completeness Percentage**: ~90-100%
- **Confidence Level**: `high`
- **Captured Elements**:
  - Date and time ✓
  - Location ✓
  - Personnel present ✓
  - Weather conditions ✓
  - Work performed ✓
  - Materials delivered ✓
  - Next steps ✓
- **Missing Elements**: Minimal or none

---

## Test Case 4: Confidence Meter - Low Completeness

### Input Transcript
```
Heute war viel los. Die Arbeiter haben gearbeitet. Morgen geht es weiter.
```

### Expected Confidence Meter Output
- **Completeness Percentage**: ~20-40%
- **Confidence Level**: `low`
- **Missing Elements**:
  - Date and time (critical)
  - Location (critical)
  - Personnel present (important)
  - Specific work details (critical)
  - Materials (optional)

---

## Test Case 5: Delta Intelligence - With Previous Entries

### Current Entry
```
Baustelle Projekt Alpha, 18. Januar.
Heute wurde der Mangel am Dach endlich behoben - das Leck ist repariert.
Neue Arbeiten: Fassadenarbeiten begonnen.
Das Problem mit den Türzargen besteht weiterhin.
```

### Previous Entry (from 15. Januar)
```
Baustelle Projekt Alpha, 15. Januar.
Dach hat immer noch ein Leck, muss dringend repariert werden.
Türzargen sitzen nicht richtig.
Elektriker haben Kabel verlegt.
```

### Previous Entry (from 12. Januar)
```
Baustelle Projekt Alpha, 12. Januar.
Leck im Dach entdeckt.
Türzargen-Problem gemeldet.
Malerarbeiten abgeschlossen.
```

### Expected Delta Intelligence Output
- **New Items**:
  - Fassadenarbeiten (category: work, significance: major)
- **Resolved Items**:
  - Dach-Leck (previousMention: 12. Januar, resolution: repariert)
- **Recurring Issues**:
  - Türzargen-Problem (occurrences: 3, trend: stable, firstMention: 12. Januar)
- **Progress Summary**: "Ein Mangel wurde behoben (Dach-Leck), ein Problem besteht weiterhin (Türzargen). Neue Arbeiten an der Fassade wurden begonnen."

---

## Test Case 6: Delta Intelligence - No Previous Entries

### Input Transcript
```
Erste Begehung Baustelle XYZ.
Rohbau abgeschlossen.
Elektroinstallation beginnt nächste Woche.
```

### Expected Delta Intelligence Output
- **New Items**: All items from current entry
- **Resolved Items**: Empty
- **Recurring Issues**: Empty
- **Progress Summary**: "Keine vorherigen Einträge zum Vergleich. Dies ist der erste dokumentierte Eintrag für dieses Projekt."
- **Comparison Period**: previousEntriesCount: 0

---

## Verification Checklist

### 1. Skills Documentation
- [ ] `.claude/skills/claim-safety/SKILL.md` exists
- [ ] `.claude/skills/confidence-meter/SKILL.md` exists
- [ ] `.claude/skills/delta-intelligence/SKILL.md` exists

### 2. Claim Safety Feature
- [ ] Generate report → Risk level badge visible (green/yellow/red)
- [ ] Safety score meter displays correctly
- [ ] Problematic phrases listed with suggestions
- [ ] "No problems" message when documentation is safe

### 3. Confidence Meter Feature
- [ ] Generate report → Completeness percentage shows
- [ ] Circular progress indicator displays correctly
- [ ] Captured elements show with checkmarks
- [ ] Missing elements show with X marks and importance labels

### 4. Delta Intelligence Feature
- [ ] With previous entries → Shows new/resolved/recurring items
- [ ] Trend indicators display (improving/stable/worsening)
- [ ] No previous entries → Shows appropriate message

### 5. Language Toggle
- [ ] Switch DE↔EN → Insights regenerate in correct language
- [ ] All UI labels update correctly

### 6. Save + Reload
- [ ] Save entry with insights
- [ ] Verify `meta` column contains smartInsights JSON
- [ ] Reload from history → Insights preserved

### 7. UI/UX
- [ ] Smart Insights section is collapsible
- [ ] Tab navigation between three panels works
- [ ] Loading spinner shows during analysis
- [ ] "Analyze" button works correctly
