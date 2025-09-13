#!/usr/bin/env node

/**
 * Snapshot Memory Manager - AI Memory and Snapshot System
 * File: /home/runner/work/Ollama-MCP-Server/Ollama-MCP-Server/ai_core/snapshot_mem.js
 *
 * Implements the snapshot memory system as required by LAW-001:
 * - Automatic snapshot generation with JSON schema structure
 * - Memory loading on system start (memory.load_snapshots=True)
 * - Snapshot storage and retrieval functionality
 * - Pattern analysis and deviation tracking
 *
 * @author mupoese_ai_core
 * @version 1.2.0
 * @license GPL-2.0
 * @law_compliance LAW-001
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '../src/utils/logger.js';

/**
 * Snapshot Memory Manager Class
 */
export class SnapshotManager {
  constructor() {
    this.snapshotDir = './memory/snapshots/';
    this.memoryLoaded = false;
    this.loadedSnapshots = [];
    this.memoryConfig = null;
  }

  /**
   * Initialize the snapshot memory system
   * Loads existing snapshots on startup (memory.load_snapshots=True)
   */
  async initialize() {
    try {
      logger.info('Initializing Snapshot Memory System');

      // Ensure snapshot directory exists
      await this.ensureSnapshotDirectory();

      // Load memory configuration
      await this.loadMemoryConfig();

      // Load existing snapshots if enabled
      if (this.memoryConfig?.memory_system?.load_snapshots_on_start) {
        await this.loadSnapshots();
        logger.info(`Loaded ${this.loadedSnapshots.length} existing snapshots`);
      }

      this.memoryLoaded = true;
      logger.info('Snapshot Memory System initialized successfully');

      return {
        status: 'ACTIVE',
        snapshots_loaded: this.loadedSnapshots.length,
        memory_config_loaded: this.memoryConfig !== null,
      };

    } catch (error) {
      logger.error('Failed to initialize Snapshot Memory System:', error);
      throw error;
    }
  }

  /**
   * Ensure snapshot directory exists
   */
  async ensureSnapshotDirectory() {
    try {
      await fs.access(this.snapshotDir);
    } catch {
      await fs.mkdir(this.snapshotDir, { recursive: true });
      logger.info(`Created snapshot directory: ${this.snapshotDir}`);
    }
  }

  /**
   * Load memory configuration
   */
  async loadMemoryConfig() {
    try {
      const configPath = './config/memory_config.json';
      const configContent = await fs.readFile(configPath, 'utf8');
      this.memoryConfig = JSON.parse(configContent);
      logger.debug('Memory configuration loaded');
    } catch (error) {
      logger.error('Failed to load memory configuration:', error);
      throw error;
    }
  }

  /**
   * Load all existing snapshots from storage
   */
  async loadSnapshots() {
    try {
      const files = await fs.readdir(this.snapshotDir);
      const snapshotFiles = files.filter(file => file.endsWith('.ai'));

      this.loadedSnapshots = [];

      for (const file of snapshotFiles) {
        try {
          const filePath = path.join(this.snapshotDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const snapshot = JSON.parse(content);

          // Validate snapshot structure
          if (this.validateSnapshotStructure(snapshot)) {
            this.loadedSnapshots.push({
              filename: file,
              data: snapshot,
              loaded_at: new Date().toISOString(),
            });
          } else {
            logger.warn(`Invalid snapshot structure in file: ${file}`);
          }
        } catch (error) {
          logger.error(`Failed to load snapshot file ${file}:`, error);
        }
      }

      logger.debug(`Successfully loaded ${this.loadedSnapshots.length} snapshots`);
      return this.loadedSnapshots;

    } catch (error) {
      logger.error('Failed to load snapshots:', error);
      throw error;
    }
  }

  /**
   * Save a new snapshot to storage
   * @param {Object} snapshot - The snapshot data to save
   */
  async saveSnapshot(snapshot) {
    try {
      // Validate snapshot structure
      if (!this.validateSnapshotStructure(snapshot)) {
        throw new Error('Invalid snapshot structure');
      }

      // Generate filename
      const filename = `snapshot_${snapshot.cycle_id || Date.now()}.ai`;
      const filePath = path.join(this.snapshotDir, filename);

      // Add metadata
      const snapshotWithMeta = {
        ...snapshot,
        saved_at: new Date().toISOString(),
        schema_version: '1.2.0',
        law_compliance: 'LAW-001',
      };

      // Save to file
      await fs.writeFile(filePath, JSON.stringify(snapshotWithMeta, null, 2), 'utf8');

      // Add to loaded snapshots
      this.loadedSnapshots.push({
        filename,
        data: snapshotWithMeta,
        loaded_at: new Date().toISOString(),
      });

      logger.info(`Snapshot saved successfully: ${filename}`);

      // Trigger cleanup if auto-cleanup is enabled
      if (this.memoryConfig?.memory_system?.auto_cleanup) {
        await this.cleanupOldSnapshots();
      }

      return {
        saved: true,
        filename,
        path: filePath,
        snapshot_id: snapshot.cycle_id,
      };

    } catch (error) {
      logger.error('Failed to save snapshot:', error);
      throw error;
    }
  }

  /**
   * Validate snapshot structure according to LAW-001 requirements
   * @param {Object} snapshot - The snapshot to validate
   */
  validateSnapshotStructure(snapshot) {
    const requiredFields = this.memoryConfig?.snapshot_schema?.required_fields || [
      'context',
      'input',
      'action',
      'applied_law',
      'reaction',
      'output',
      'ai_signature',
      'timestamp',
    ];

    for (const field of requiredFields) {
      if (!(field in snapshot)) {
        logger.warn(`Missing required field in snapshot: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Retrieve snapshots based on criteria
   * @param {Object} criteria - Search criteria
   */
  async getSnapshots(criteria = {}) {
    if (!this.memoryLoaded) {
      await this.initialize();
    }

    let filteredSnapshots = [...this.loadedSnapshots];

    // Filter by timestamp if provided
    if (criteria.from_timestamp) {
      filteredSnapshots = filteredSnapshots.filter(
        s => s.data.timestamp >= criteria.from_timestamp,
      );
    }

    if (criteria.to_timestamp) {
      filteredSnapshots = filteredSnapshots.filter(
        s => s.data.timestamp <= criteria.to_timestamp,
      );
    }

    // Filter by law_id if provided
    if (criteria.law_id) {
      filteredSnapshots = filteredSnapshots.filter(
        s => s.data.law_id === criteria.law_id,
      );
    }

    // Filter by deviation presence if requested
    if (criteria.has_deviation !== undefined) {
      filteredSnapshots = filteredSnapshots.filter(
        s => (s.data.deviation !== null) === criteria.has_deviation,
      );
    }

    return filteredSnapshots;
  }

  /**
   * Analyze patterns in loaded snapshots
   */
  async analyzePatterns() {
    if (!this.memoryLoaded) {
      await this.initialize();
    }

    const analysis = {
      total_snapshots: this.loadedSnapshots.length,
      deviations_found: 0,
      pattern_analysis: {},
      timestamp: new Date().toISOString(),
    };

    // Count deviations
    analysis.deviations_found = this.loadedSnapshots.filter(
      s => s.data.deviation !== null && s.data.deviation !== undefined,
    ).length;

    // Analyze action patterns
    const actionTypes = {};
    this.loadedSnapshots.forEach(s => {
      const actionType = s.data.action?.type || 'unknown';
      actionTypes[actionType] = (actionTypes[actionType] || 0) + 1;
    });
    analysis.pattern_analysis.action_types = actionTypes;

    // Analyze temporal patterns
    const timePattern = this.analyzeTemporalPatterns();
    analysis.pattern_analysis.temporal = timePattern;

    logger.info('Pattern analysis completed', analysis);
    return analysis;
  }

  /**
   * Analyze temporal patterns in snapshots
   */
  analyzeTemporalPatterns() {
    const timestamps = this.loadedSnapshots
      .map(s => new Date(s.data.timestamp))
      .sort((a, b) => a - b);

    if (timestamps.length < 2) {
      return { status: 'insufficient_data' };
    }

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    return {
      total_snapshots: timestamps.length,
      average_interval_ms: averageInterval,
      first_snapshot: timestamps[0].toISOString(),
      last_snapshot: timestamps[timestamps.length - 1].toISOString(),
    };
  }

  /**
   * Clean up old snapshots based on retention policy
   */
  async cleanupOldSnapshots() {
    try {
      const retentionDays = this.memoryConfig?.memory_system?.snapshot_retention_days || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const files = await fs.readdir(this.snapshotDir);
      let cleanedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.ai')) continue;

        const filePath = path.join(this.snapshotDir, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          cleanedCount++;

          // Remove from loaded snapshots
          this.loadedSnapshots = this.loadedSnapshots.filter(
            s => s.filename !== file,
          );
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} old snapshot files`);
      }

      return { cleaned: cleanedCount };

    } catch (error) {
      logger.error('Failed to cleanup old snapshots:', error);
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      memory_loaded: this.memoryLoaded,
      total_snapshots: this.loadedSnapshots.length,
      memory_config_present: this.memoryConfig !== null,
      snapshot_directory: this.snapshotDir,
      last_initialized: this.memoryLoaded ? new Date().toISOString() : null,
    };
  }
}

// Export singleton instance
export const snapshotManager = new SnapshotManager();

// Export snapshot_mem function as required by LAW-001
export const snapshot_mem = () => snapshotManager;
