/**
 * Integration Test - AI Core Server Integration
 * Tests that the server can start with AI core enabled
 *
 * @author mupoese_ai_core
 * @version 1.2.0
 * @license GPL-2.0
 * @law_compliance LAW-001
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import fs from 'fs/promises';

describe('Server Integration with AI Core', () => {
  beforeAll(async() => {
    // Ensure required directories exist
    await fs.mkdir('./memory/snapshots', { recursive: true });
  });

  test('should validate AI core components can be imported and initialized', async() => {
    // Test that AI core modules can be imported without errors
    try {
      const { lawEnforcer } = await import('../ai_core/law_enforcer.js');
      const { learningCycle } = await import('../ai_core/learning_cycle.js');
      const { snapshotManager } = await import('../ai_core/snapshot_mem.js');
      const { patternDetector } = await import('../logic/pattern_detector.js');

      expect(lawEnforcer).toBeDefined();
      expect(learningCycle).toBeDefined();
      expect(snapshotManager).toBeDefined();
      expect(patternDetector).toBeDefined();

      // Test that they have expected methods
      expect(typeof lawEnforcer.initialize).toBe('function');
      expect(typeof learningCycle.executeCycle).toBe('function');
      expect(typeof snapshotManager.initialize).toBe('function');
      expect(typeof patternDetector.detectPatterns).toBe('function');

    } catch {
      expect(false).toBe(true); // Should be able to import AI core modules
    }
  });

  test('should have AI core files in correct structure', async() => {
    // Verify directory structure exists
    const dirsToCheck = [
      './ai_core',
      './logic',
      './governance',
      './memory/snapshots',
      './config',
    ];

    for (const dir of dirsToCheck) {
      try {
        await fs.access(dir);
        expect(true).toBe(true); // Directory exists
      } catch {
        expect(false).toBe(true); // Directory should exist
      }
    }

    // Verify key files exist
    const filesToCheck = [
      './law.ai',
      './ai_core/law_enforcer.js',
      './ai_core/learning_cycle.js',
      './ai_core/snapshot_mem.js',
      './logic/pattern_detector.js',
      './config/ai_status.json',
      './config/memory_config.json',
    ];

    for (const file of filesToCheck) {
      try {
        await fs.access(file);
        expect(true).toBe(true); // File exists
      } catch {
        expect(false).toBe(true); // File should exist
      }
    }
  });

  test('should validate law.ai contains LAW-001', async() => {
    try {
      const lawContent = await fs.readFile('./law.ai', 'utf8');
      expect(lawContent).toContain('LAW-001');
      expect(lawContent).toContain('6-step learning cycle');
      expect(lawContent).toContain('CRITICAL');
      expect(lawContent).toContain('Enforceable: TRUE');
    } catch {
      expect(false).toBe(true); // law.ai should be readable
    }
  });

  test('should validate AI status configuration', async() => {
    try {
      const aiStatusContent = await fs.readFile('./config/ai_status.json', 'utf8');
      const aiStatus = JSON.parse(aiStatusContent);

      expect(aiStatus.dependencies).toBeDefined();
      expect(aiStatus.dependencies['memory.snapshot_mem']).toBe('ACTIVE');
      expect(aiStatus.dependencies['laws.snapshot_validation']).toBe(true);
      expect(aiStatus.dependencies['ai_status.verified']).toBe(true);
      expect(aiStatus.dependencies['logic_engine.boot']).toBe('SUCCESS');
    } catch {
      expect(false).toBe(true); // ai_status.json should be valid
    }
  });
});
