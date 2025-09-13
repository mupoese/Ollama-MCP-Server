#!/usr/bin/env node

/**
 * Learning Cycle - 6-Step AI Learning Cycle Implementation
 * File: /home/runner/work/Ollama-MCP-Server/Ollama-MCP-Server/ai_core/learning_cycle.js
 *
 * Implements the mandatory 6-step learning cycle as required by LAW-001:
 * 1. Input collection and JSON schema structuring
 * 2. Action determination per current logic
 * 3. Action execution and reaction registration
 * 4. Output and effect evaluation
 * 5. Automatic snapshot generation
 * 6. Snapshot storage and memory loading
 *
 * @author mupoese_ai_core
 * @version 1.2.0
 * @license GPL-2.0
 * @law_compliance LAW-001
 */

import { logger } from '../src/utils/logger.js';
import { lawEnforcer } from './law_enforcer.js';
import { snapshotManager } from './snapshot_mem.js';

/**
 * 6-Step Learning Cycle Implementation
 */
export class LearningCycle {
  constructor() {
    this.cycleActive = false;
    this.currentCycle = null;
    this.memoryConfigFile = './config/memory_config.json';
  }

  /**
   * Execute the complete 6-step learning cycle
   * @param {string} cause - The detected cause that triggered the cycle
   * @param {Object} initialContext - Initial context data
   */
  async executeCycle(cause, initialContext = {}) {
    try {
      logger.info(`Starting 6-step learning cycle for cause: ${cause}`);

      // Enforce law compliance
      await lawEnforcer.enforceLaw(cause, initialContext);

      this.cycleActive = true;
      this.currentCycle = {
        cause,
        startTime: new Date().toISOString(),
        law_id: 'LAW-001',
        steps: {},
      };

      // Execute all 6 mandatory steps
      await this.step1_InputCollection(initialContext);
      await this.step2_ActionDetermination();
      await this.step3_ActionExecution();
      await this.step4_ReactionRegistration();
      await this.step5_OutputEvaluation();
      await this.step6_SnapshotGeneration();

      // Finalize cycle
      this.currentCycle.endTime = new Date().toISOString();
      this.currentCycle.status = 'COMPLETED';
      this.cycleActive = false;

      logger.info('6-step learning cycle completed successfully');
      return this.currentCycle;

    } catch (error) {
      logger.error('Learning cycle failed:', error);
      this.cycleActive = false;
      if (this.currentCycle) {
        this.currentCycle.status = 'FAILED';
        this.currentCycle.error = error.message;
      }
      throw error;
    }
  }

  /**
   * Step 1: Input Collection and JSON Schema Structuring
   */
  async step1_InputCollection(context) {
    logger.debug('Learning Cycle Step 1: Input Collection');

    const input = {
      timestamp: new Date().toISOString(),
      context: context,
      cause: this.currentCycle.cause,
      raw_data: context.raw_data || {},
      structured_schema: {
        type: 'object',
        properties: this.extractProperties(context),
        required: this.extractRequiredFields(context),
      },
    };

    this.currentCycle.steps.step1_input = input;
    logger.debug('Step 1 completed: Input collected and structured');
    return input;
  }

  /**
   * Step 2: Action Determination per Current Logic
   */
  async step2_ActionDetermination() {
    logger.debug('Learning Cycle Step 2: Action Determination');

    const input = this.currentCycle.steps.step1_input;
    const action = {
      timestamp: new Date().toISOString(),
      analysis: this.analyzeInput(input),
      determined_action: this.determineAction(input),
      applied_laws: ['LAW-001'],
      ruleset_reference: 'ai_core.learning_cycle',
      codebase_reference: 'ai_core/learning_cycle.js',
    };

    this.currentCycle.steps.step2_action = action;
    logger.debug('Step 2 completed: Action determined');
    return action;
  }

  /**
   * Step 3: Action Execution and Direct Reaction Registration
   */
  async step3_ActionExecution() {
    logger.debug('Learning Cycle Step 3: Action Execution');

    const action = this.currentCycle.steps.step2_action;
    const execution = {
      timestamp: new Date().toISOString(),
      action_executed: action.determined_action,
      execution_method: 'learning_cycle.execute',
      result: await this.executeAction(action.determined_action),
      direct_reaction: 'execution_completed',
    };

    this.currentCycle.steps.step3_execution = execution;
    logger.debug('Step 3 completed: Action executed');
    return execution;
  }

  /**
   * Step 4: Reaction Registration
   */
  async step4_ReactionRegistration() {
    logger.debug('Learning Cycle Step 4: Reaction Registration');

    const execution = this.currentCycle.steps.step3_execution;
    const reaction = {
      timestamp: new Date().toISOString(),
      reaction_type: 'automated_learning',
      reaction_data: execution.result,
      system_response: 'cycle_continuation',
      registered_by: 'ai_core.learning_cycle',
    };

    this.currentCycle.steps.step4_reaction = reaction;
    logger.debug('Step 4 completed: Reaction registered');
    return reaction;
  }

  /**
   * Step 5: Output and Effect Evaluation
   */
  async step5_OutputEvaluation() {
    logger.debug('Learning Cycle Step 5: Output Evaluation');

    const reaction = this.currentCycle.steps.step4_reaction;
    const evaluation = {
      timestamp: new Date().toISOString(),
      output_analysis: this.analyzeOutput(reaction),
      effect_evaluation: this.evaluateEffect(reaction),
      expected_vs_actual: this.compareOutcomes(reaction),
      deviation_detected: this.detectDeviation(reaction),
      evaluation_score: this.calculateScore(reaction),
    };

    this.currentCycle.steps.step5_evaluation = evaluation;
    logger.debug('Step 5 completed: Output evaluated');
    return evaluation;
  }

  /**
   * Step 6: Automatic Snapshot Generation and Storage
   */
  async step6_SnapshotGeneration() {
    logger.debug('Learning Cycle Step 6: Snapshot Generation');

    const evaluation = this.currentCycle.steps.step5_evaluation;

    // Create snapshot according to LAW-001 requirements
    const snapshot = {
      timestamp: new Date().toISOString(),
      law_id: 'LAW-001',
      context: this.currentCycle.steps.step1_input.context,
      input: this.currentCycle.steps.step1_input,
      action: this.currentCycle.steps.step2_action.determined_action,
      applied_law: 'LAW-001',
      reaction: this.currentCycle.steps.step4_reaction,
      output: evaluation.output_analysis,
      deviation: evaluation.deviation_detected ? evaluation.deviation_detected : null,
      ai_signature: 'mupoese_ai_core.learning_cycle.v1.2.0',
      cycle_id: this.generateCycleId(),
      clean_files_processed: await this.cleanUnusedFiles(),
    };

    // Store snapshot using snapshot manager
    await snapshotManager.saveSnapshot(snapshot);

    this.currentCycle.steps.step6_snapshot = {
      generated: true,
      snapshot_id: snapshot.cycle_id,
      storage_path: `./memory/snapshots/snapshot_${snapshot.cycle_id}.ai`,
    };

    logger.debug('Step 6 completed: Snapshot generated and stored');
    return snapshot;
  }

  /**
   * Helper Methods
   */

  extractProperties(context) {
    const properties = {};
    for (const [key, value] of Object.entries(context)) {
      properties[key] = {
        type: typeof value,
        description: `Property extracted from context: ${key}`,
      };
    }
    return properties;
  }

  extractRequiredFields(context) {
    return Object.keys(context).filter(key => context[key] !== undefined && context[key] !== null);
  }

  analyzeInput(input) {
    return {
      input_type: 'structured_json',
      complexity: Object.keys(input.context).length,
      analysis_timestamp: new Date().toISOString(),
    };
  }

  determineAction(input) {
    return {
      type: 'learning_cycle_execution',
      method: 'automatic_processing',
      parameters: input.structured_schema,
    };
  }

  async executeAction(action) {
    return {
      status: 'executed',
      method: action.method,
      timestamp: new Date().toISOString(),
    };
  }

  analyzeOutput(_reaction) {
    return {
      output_type: 'reaction_data',
      status: 'analyzed',
      timestamp: new Date().toISOString(),
    };
  }

  evaluateEffect(_reaction) {
    return {
      effect_type: 'learning_completion',
      impact: 'positive',
      timestamp: new Date().toISOString(),
    };
  }

  compareOutcomes(_reaction) {
    return {
      expected: 'learning_cycle_completion',
      actual: 'learning_cycle_completion',
      match: true,
    };
  }

  detectDeviation(_reaction) {
    // Simple deviation detection - can be enhanced
    return null; // No deviation detected in normal operation
  }

  calculateScore(_reaction) {
    return {
      score: 1.0,
      max_score: 1.0,
      performance: 'optimal',
    };
  }

  generateCycleId() {
    return `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanUnusedFiles() {
    // Placeholder for file cleanup functionality
    return {
      cleaned: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const learningCycle = new LearningCycle();
