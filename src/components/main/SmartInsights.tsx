'use client';

import { useState } from 'react';
import type { SmartInsights as SmartInsightsType, Language } from '@/lib/types';

interface SmartInsightsProps {
  insights: SmartInsightsType | null;
  isProcessing: boolean;
  language: Language;
  onGenerate: () => void;
}

export function SmartInsights({ insights, isProcessing, language, onGenerate }: SmartInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activePanel, setActivePanel] = useState<'safety' | 'confidence' | 'delta'>('safety');

  const labels = {
    title: language === 'de' ? 'Smart Insights' : 'Smart Insights',
    generate: language === 'de' ? 'Analysieren' : 'Analyze',
    generating: language === 'de' ? 'Analysiere...' : 'Analyzing...',
    safety: language === 'de' ? 'Risiko' : 'Risk',
    confidence: language === 'de' ? 'Vollständigkeit' : 'Completeness',
    delta: language === 'de' ? 'Änderungen' : 'Changes',
    noInsights: language === 'de' ? 'Klicke "Analysieren" um Insights zu generieren' : 'Click "Analyze" to generate insights',
    safe: language === 'de' ? 'Sicher' : 'Safe',
    caution: language === 'de' ? 'Vorsicht' : 'Caution',
    risky: language === 'de' ? 'Riskant' : 'Risky',
    high: language === 'de' ? 'Hoch' : 'High',
    medium: language === 'de' ? 'Mittel' : 'Medium',
    low: language === 'de' ? 'Niedrig' : 'Low',
    noProblems: language === 'de' ? 'Keine problematischen Formulierungen gefunden' : 'No problematic phrases found',
    problemPhrase: language === 'de' ? 'Problematische Formulierung' : 'Problematic Phrase',
    suggestion: language === 'de' ? 'Vorschlag' : 'Suggestion',
    captured: language === 'de' ? 'Erfasst' : 'Captured',
    missing: language === 'de' ? 'Fehlend' : 'Missing',
    newItems: language === 'de' ? 'Neu' : 'New',
    resolved: language === 'de' ? 'Gelöst' : 'Resolved',
    recurring: language === 'de' ? 'Wiederkehrend' : 'Recurring',
    noPrevious: language === 'de' ? 'Keine vorherigen Einträge zum Vergleich' : 'No previous entries to compare',
    improving: language === 'de' ? 'Verbessert sich' : 'Improving',
    stable: language === 'de' ? 'Stabil' : 'Stable',
    worsening: language === 'de' ? 'Verschlechtert sich' : 'Worsening',
  };

  const getRiskColor = (level: 'safe' | 'caution' | 'risky') => {
    switch (level) {
      case 'safe':
        return 'bg-green-500';
      case 'caution':
        return 'bg-yellow-500';
      case 'risky':
        return 'bg-red-500';
    }
  };

  const getRiskBgColor = (level: 'safe' | 'caution' | 'risky') => {
    switch (level) {
      case 'safe':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'caution':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'risky':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    }
  };

  const getConfidenceColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'text-green-600 dark:text-green-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'worsening') => {
    switch (trend) {
      case 'improving':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'worsening':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors rounded px-2 py-1 -ml-2"
        >
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-neutral-400">
            {labels.title}
          </span>
          {insights && (
            <span className="text-xs text-slate-400 dark:text-neutral-500">
              ({new Date(insights.generatedAt).toLocaleTimeString(language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </button>
        <button
          onClick={onGenerate}
          disabled={isProcessing}
          className="px-3 py-1 text-xs font-medium text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {labels.generating}
            </span>
          ) : (
            labels.generate
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-4">
          {!insights && !isProcessing ? (
            <p className="text-sm text-slate-400 dark:text-neutral-500 text-center py-4">
              {labels.noInsights}
            </p>
          ) : (
            <>
              {/* Tab navigation */}
              <div className="flex gap-1 mb-4">
                <button
                  onClick={() => setActivePanel('safety')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                    activePanel === 'safety'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {labels.safety}
                </button>
                <button
                  onClick={() => setActivePanel('confidence')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                    activePanel === 'confidence'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {labels.confidence}
                </button>
                <button
                  onClick={() => setActivePanel('delta')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors ${
                    activePanel === 'delta'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {labels.delta}
                </button>
              </div>

              {/* Panel content */}
              <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-lg p-4 min-h-[200px]">
                {isProcessing ? (
                  <div className="flex items-center justify-center h-full py-8">
                    <svg className="animate-spin h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : (
                  <>
                    {/* Claim Safety Panel */}
                    {activePanel === 'safety' && insights?.claimSafety && (
                      <div className="space-y-4">
                        {/* Risk badge and score */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getRiskBgColor(insights.claimSafety.riskLevel)}`}>
                              {labels[insights.claimSafety.riskLevel]}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-neutral-300">
                              {language === 'de' ? 'Sicherheitswert' : 'Safety Score'}: {insights.claimSafety.overallSafetyScore}%
                            </span>
                          </div>
                        </div>

                        {/* Safety meter */}
                        <div className="w-full bg-slate-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getRiskColor(insights.claimSafety.riskLevel)}`}
                            style={{ width: `${insights.claimSafety.overallSafetyScore}%` }}
                          />
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-slate-600 dark:text-neutral-300">
                          {insights.claimSafety.summary}
                        </p>

                        {/* Problematic phrases */}
                        {insights.claimSafety.problematicPhrases.length === 0 ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">{labels.noProblems}</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {insights.claimSafety.problematicPhrases.map((phrase, i) => (
                              <div key={i} className="bg-white dark:bg-neutral-800 rounded p-3 border border-slate-200 dark:border-neutral-700">
                                <div className="flex items-start gap-2">
                                  <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-600 dark:text-neutral-300 line-through">&quot;{phrase.original}&quot;</p>
                                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">{phrase.issue}</p>
                                    {phrase.legalReference && (
                                      <div className="mt-1.5 flex items-center gap-1.5">
                                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                          {phrase.legalReference}
                                        </span>
                                      </div>
                                    )}
                                    <div className="mt-2 flex items-start gap-2">
                                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">{labels.suggestion}:</span>
                                      <p className="text-sm text-green-700 dark:text-green-300">&quot;{phrase.suggestedRewrite}&quot;</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confidence Meter Panel */}
                    {activePanel === 'confidence' && insights?.confidenceMeter && (
                      <div className="space-y-4">
                        {/* Completeness percentage */}
                        <div className="flex items-center justify-between">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-200 dark:text-neutral-700"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - insights.confidenceMeter.completenessPercentage / 100)}`}
                                className={getConfidenceColor(insights.confidenceMeter.confidenceLevel)}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-700 dark:text-neutral-200">
                              {insights.confidenceMeter.completenessPercentage}%
                            </span>
                          </div>
                          <div className="flex-1 ml-4">
                            <span className={`text-sm font-medium ${getConfidenceColor(insights.confidenceMeter.confidenceLevel)}`}>
                              {labels[insights.confidenceMeter.confidenceLevel]} {language === 'de' ? 'Konfidenz' : 'Confidence'}
                            </span>
                            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                              {insights.confidenceMeter.summary}
                            </p>
                          </div>
                        </div>

                        {/* Captured elements */}
                        {insights.confidenceMeter.capturedElements.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                              {labels.captured}
                            </h4>
                            <div className="space-y-1">
                              {insights.confidenceMeter.capturedElements.filter(e => e.captured).map((elem, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-slate-600 dark:text-neutral-300">{elem.element}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing elements */}
                        {insights.confidenceMeter.missingElements.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                              {labels.missing}
                            </h4>
                            <div className="space-y-2">
                              {insights.confidenceMeter.missingElements.map((elem, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <div>
                                    <span className="text-slate-600 dark:text-neutral-300">{elem.element}</span>
                                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                      elem.importance === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                      elem.importance === 'important' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                      'bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400'
                                    }`}>
                                      {elem.importance}
                                    </span>
                                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{elem.reason}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delta Intelligence Panel */}
                    {activePanel === 'delta' && insights?.deltaIntelligence && (
                      <div className="space-y-4">
                        {/* Progress summary */}
                        <p className="text-sm text-slate-600 dark:text-neutral-300">
                          {insights.deltaIntelligence.progressSummary}
                        </p>

                        {/* Comparison period info */}
                        <div className="text-xs text-slate-400 dark:text-neutral-500">
                          {insights.deltaIntelligence.comparisonPeriod.previousEntriesCount === 0 ? (
                            labels.noPrevious
                          ) : (
                            `${insights.deltaIntelligence.comparisonPeriod.previousEntriesCount} ${language === 'de' ? 'vorherige Einträge' : 'previous entries'} (${insights.deltaIntelligence.comparisonPeriod.dateRange})`
                          )}
                        </div>

                        {/* New items */}
                        {insights.deltaIntelligence.newItems.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              {labels.newItems}
                            </h4>
                            <div className="space-y-1">
                              {insights.deltaIntelligence.newItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    item.significance === 'major' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-neutral-700 text-slate-500 dark:text-neutral-400'
                                  }`}>
                                    {item.category}
                                  </span>
                                  <span className="text-slate-600 dark:text-neutral-300">{item.item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Resolved items */}
                        {insights.deltaIntelligence.resolvedItems.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {labels.resolved}
                            </h4>
                            <div className="space-y-2">
                              {insights.deltaIntelligence.resolvedItems.map((item, i) => (
                                <div key={i} className="text-sm bg-white dark:bg-neutral-800 rounded p-2 border border-slate-200 dark:border-neutral-700">
                                  <span className="text-slate-600 dark:text-neutral-300">{item.item}</span>
                                  <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
                                    {item.resolution} ({language === 'de' ? 'erwähnt am' : 'mentioned on'} {item.previousMention})
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recurring issues */}
                        {insights.deltaIntelligence.recurringIssues.length > 0 && (
                          <div>
                            <h4 className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {labels.recurring}
                            </h4>
                            <div className="space-y-2">
                              {insights.deltaIntelligence.recurringIssues.map((issue, i) => (
                                <div key={i} className="flex items-center justify-between text-sm bg-white dark:bg-neutral-800 rounded p-2 border border-slate-200 dark:border-neutral-700">
                                  <div>
                                    <span className="text-slate-600 dark:text-neutral-300">{issue.issue}</span>
                                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
                                      {issue.occurrences}x ({language === 'de' ? 'seit' : 'since'} {issue.firstMention})
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {getTrendIcon(issue.trend)}
                                    <span className="text-xs text-slate-500 dark:text-neutral-400">
                                      {labels[issue.trend]}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty state */}
                        {insights.deltaIntelligence.newItems.length === 0 &&
                         insights.deltaIntelligence.resolvedItems.length === 0 &&
                         insights.deltaIntelligence.recurringIssues.length === 0 && (
                          <p className="text-sm text-slate-400 dark:text-neutral-500 text-center py-4">
                            {labels.noPrevious}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Fallback when panel data is missing */}
                    {activePanel === 'safety' && !insights?.claimSafety && (
                      <p className="text-sm text-slate-400 dark:text-neutral-500 text-center py-8">
                        {language === 'de' ? 'Risikoanalyse nicht verfügbar' : 'Risk analysis not available'}
                      </p>
                    )}
                    {activePanel === 'confidence' && !insights?.confidenceMeter && (
                      <p className="text-sm text-slate-400 dark:text-neutral-500 text-center py-8">
                        {language === 'de' ? 'Vollständigkeitsanalyse nicht verfügbar' : 'Completeness analysis not available'}
                      </p>
                    )}
                    {activePanel === 'delta' && !insights?.deltaIntelligence && (
                      <p className="text-sm text-slate-400 dark:text-neutral-500 text-center py-8">
                        {language === 'de' ? 'Änderungsanalyse nicht verfügbar' : 'Change analysis not available'}
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
