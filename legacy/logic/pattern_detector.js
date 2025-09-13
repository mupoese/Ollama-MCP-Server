#!/usr/bin/env node

/**
 * Pattern Detector - AI Pattern Detection and Deviation Analysis
 * File: /home/runner/work/Ollama-MCP-Server/Ollama-MCP-Server/logic/pattern_detector.js
 *
 * Implements pattern detection for systematic deviations as required by LAW-001:
 * - Detects recurring patterns in AI operations
 * - Identifies systematic deviations above threshold
 * - Triggers escalation for pattern-based anomalies
 * - Supports learning cycle optimization
 *
 * @author mupoese_ai_core
 * @version 1.2.0
 * @license GPL-2.0
 * @law_compliance LAW-001
 */

import fs from 'fs/promises';
import { logger } from '../src/utils/logger.js';
import { snapshotManager } from '../ai_core/snapshot_mem.js';

/**
 * Pattern Detector Class
 */
export class PatternDetector {
  constructor() {
    this.thresholdConfig = null;
    this.detectedPatterns = [];
    this.systematicDeviations = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the pattern detector
   */
  async initialize() {
    try {
      logger.info('Initializing Pattern Detector System');

      // Load configuration
      await this.loadConfiguration();

      // Initialize snapshot manager if not already done
      await snapshotManager.initialize();

      this.isInitialized = true;
      logger.info('Pattern Detector System initialized successfully');

      return {
        status: 'ACTIVE',
        threshold_loaded: this.thresholdConfig !== null,
        patterns_detected: this.detectedPatterns.length,
      };

    } catch (error) {
      logger.error('Failed to initialize Pattern Detector:', error);
      throw error;
    }
  }

  /**
   * Load pattern detection configuration
   */
  async loadConfiguration() {
    try {
      const memoryConfigPath = './config/memory_config.json';
      const content = await fs.readFile(memoryConfigPath, 'utf8');
      const config = JSON.parse(content);

      this.thresholdConfig = {
        pattern_detection_threshold: config.memory_system?.pattern_detection_threshold || 3,
        deviation_severity_levels: {
          low: 1,
          medium: 3,
          high: 5,
          critical: 10,
        },
        pattern_analysis_window: 100, // Number of snapshots to analyze
        escalation_threshold: 5,
      };

      logger.debug('Pattern detection configuration loaded');
    } catch (error) {
      logger.error('Failed to load pattern detection configuration:', error);
      throw error;
    }
  }

  /**
   * Detect patterns in recent AI operations
   * @param {Object} options - Detection options
   */
  async detectPatterns(options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      logger.info('Starting pattern detection analysis');

      // Get recent snapshots for analysis
      const snapshots = await snapshotManager.getSnapshots({
        from_timestamp: options.fromTimestamp || this.getAnalysisStartTime(),
      });

      if (snapshots.length < 2) {
        logger.info('Insufficient snapshots for pattern detection');
        return { patterns: [], analysis: 'insufficient_data' };
      }

      // Perform various pattern detection analyses
      const results = {
        timestamp: new Date().toISOString(),
        snapshots_analyzed: snapshots.length,
        patterns: {
          action_patterns: await this.detectActionPatterns(snapshots),
          deviation_patterns: await this.detectDeviationPatterns(snapshots),
          temporal_patterns: await this.detectTemporalPatterns(snapshots),
          systematic_patterns: await this.detectSystematicPatterns(snapshots),
        },
        escalations: [],
      };

      // Check for systematic deviations requiring escalation
      results.escalations = await this.checkForEscalation(results.patterns);

      // Update internal state
      this.detectedPatterns.push(results);

      logger.info(`Pattern detection completed. Found ${Object.keys(results.patterns).length} pattern types`);
      return results;

    } catch (error) {
      logger.error('Pattern detection failed:', error);
      throw error;
    }
  }

  /**
   * Detect action-based patterns
   */
  async detectActionPatterns(snapshots) {
    const actionSequences = snapshots.map(s => ({
      timestamp: s.data.timestamp,
      action: s.data.action?.type || 'unknown',
      result: s.data.output?.status || 'unknown',
    }));

    // Find recurring action sequences
    const sequences = {};
    for (let i = 0; i < actionSequences.length - 1; i++) {
      const sequence = `${actionSequences[i].action}->${actionSequences[i + 1].action}`;
      sequences[sequence] = (sequences[sequence] || 0) + 1;
    }

    // Identify significant patterns
    const patterns = Object.entries(sequences)
      .filter(([_seq, count]) => count >= this.thresholdConfig.pattern_detection_threshold)
      .map(([sequence, count]) => ({
        type: 'action_sequence',
        pattern: sequence,
        frequency: count,
        significance: this.calculatePatternSignificance(count, snapshots.length),
      }));

    return patterns;
  }

  /**
   * Detect deviation patterns
   */
  async detectDeviationPatterns(snapshots) {
    const deviationSnapshots = snapshots.filter(s => s.data.deviation !== null);

    if (deviationSnapshots.length === 0) {
      return { status: 'no_deviations_found' };
    }

    // Analyze deviation types and frequencies
    const deviationTypes = {};
    deviationSnapshots.forEach(s => {
      const devType = s.data.deviation?.type || 'unknown';
      deviationTypes[devType] = (deviationTypes[devType] || 0) + 1;
    });

    // Calculate deviation rate
    const deviationRate = deviationSnapshots.length / snapshots.length;

    return {
      total_deviations: deviationSnapshots.length,
      deviation_rate: deviationRate,
      deviation_types: deviationTypes,
      severity: this.assessDeviationSeverity(deviationRate),
      requires_attention: deviationRate > 0.1, // 10% threshold
    };
  }

  /**
   * Detect temporal patterns
   */
  async detectTemporalPatterns(snapshots) {
    const timestamps = snapshots.map(s => new Date(s.data.timestamp)).sort((a, b) => a - b);

    if (timestamps.length < 3) {
      return { status: 'insufficient_temporal_data' };
    }

    // Calculate intervals between operations
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    // Detect regular patterns
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariance = this.calculateVariance(intervals, avgInterval);

    return {
      average_interval_ms: avgInterval,
      interval_variance: intervalVariance,
      regularity_score: this.calculateRegularityScore(intervalVariance, avgInterval),
      pattern_type: this.classifyTemporalPattern(avgInterval, intervalVariance),
    };
  }

  /**
   * Detect systematic patterns that may indicate issues
   */
  async detectSystematicPatterns(snapshots) {
    const patterns = [];

    // Check for recurring failure patterns
    const failures = snapshots.filter(s =>
      s.data.output?.status === 'failed' ||
      s.data.deviation !== null,
    );

    if (failures.length >= this.thresholdConfig.pattern_detection_threshold) {
      patterns.push({
        type: 'systematic_failures',
        count: failures.length,
        rate: failures.length / snapshots.length,
        severity: 'high',
        recommendation: 'investigate_failure_causes',
      });
    }

    // Check for repeated identical inputs (possible loops)
    const inputHashes = {};
    snapshots.forEach(s => {
      const inputHash = this.hashInput(s.data.input);
      inputHashes[inputHash] = (inputHashes[inputHash] || 0) + 1;
    });

    const repeatedInputs = Object.entries(inputHashes)
      .filter(([_hash, count]) => count >= this.thresholdConfig.pattern_detection_threshold);

    if (repeatedInputs.length > 0) {
      patterns.push({
        type: 'repeated_inputs',
        instances: repeatedInputs.length,
        max_repetitions: Math.max(...repeatedInputs.map(([_h, c]) => c)),
        severity: 'medium',
        recommendation: 'check_for_infinite_loops',
      });
    }

    return patterns;
  }

  /**
   * Check if patterns require escalation
   */
  async checkForEscalation(patterns) {
    const escalations = [];

    // Check deviation patterns
    if (patterns.deviation_patterns?.requires_attention) {
      escalations.push({
        type: 'high_deviation_rate',
        severity: patterns.deviation_patterns.severity,
        details: patterns.deviation_patterns,
        action_required: 'governance_review',
        timestamp: new Date().toISOString(),
      });
    }

    // Check systematic patterns
    patterns.systematic_patterns?.forEach(pattern => {
      if (pattern.severity === 'high' || pattern.severity === 'critical') {
        escalations.push({
          type: 'systematic_pattern_detected',
          pattern: pattern.type,
          severity: pattern.severity,
          recommendation: pattern.recommendation,
          action_required: 'immediate_review',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Log escalations
    if (escalations.length > 0) {
      logger.warn(`${escalations.length} patterns require escalation`, { escalations });
      await this.triggerEscalation(escalations);
    }

    return escalations;
  }

  /**
   * Trigger escalation process
   */
  async triggerEscalation(escalations) {
    try {
      // Create escalation record
      const escalationRecord = {
        timestamp: new Date().toISOString(),
        escalations: escalations,
        status: 'triggered',
        law_compliance: 'LAW-001',
        requires_governance_review: true,
      };

      // Save escalation record for governance review
      const escalationPath = './logic/escalation_record.json';
      await fs.writeFile(escalationPath, JSON.stringify(escalationRecord, null, 2));

      logger.info('Escalation triggered and recorded', { count: escalations.length });

    } catch (error) {
      logger.error('Failed to trigger escalation:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */

  getAnalysisStartTime() {
    const now = new Date();
    now.setHours(now.getHours() - 24); // Last 24 hours
    return now.toISOString();
  }

  calculatePatternSignificance(count, total) {
    return count / total;
  }

  assessDeviationSeverity(rate) {
    if (rate >= 0.5) return 'critical';
    if (rate >= 0.2) return 'high';
    if (rate >= 0.1) return 'medium';
    return 'low';
  }

  calculateVariance(values, mean) {
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  calculateRegularityScore(variance, mean) {
    // Lower variance relative to mean indicates more regular pattern
    return mean > 0 ? 1 - Math.min(variance / (mean * mean), 1) : 0;
  }

  classifyTemporalPattern(avgInterval, variance) {
    const regularityScore = this.calculateRegularityScore(variance, avgInterval);

    if (regularityScore > 0.8) return 'highly_regular';
    if (regularityScore > 0.6) return 'moderately_regular';
    if (regularityScore > 0.4) return 'somewhat_irregular';
    return 'highly_irregular';
  }

  hashInput(input) {
    // Simple hash function for input comparison
    return JSON.stringify(input).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString();
  }

  /**
   * Get pattern detection statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      patterns_detected: this.detectedPatterns.length,
      systematic_deviations: this.systematicDeviations.length,
      threshold_config: this.thresholdConfig,
    };
  }
}

// Export singleton instance
export const patternDetector = new PatternDetector();
