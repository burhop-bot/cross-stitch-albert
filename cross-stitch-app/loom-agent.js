#!/usr/bin/env node
/**
 * Loom Agent - Industrialized E2E Test Fix Engine
 * 
 * Features:
 * - Self-monitoring and health checks
 * - Automatic recovery from common failures
 * - Status dashboard and reporting
 * - Proper error handling and logging
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/sandbox/.openclaw-data/workspace/cross-stitch-app';
const LOOM_DIR = '/sandbox/.openclaw-data/workspace/loom';
const HEALTH_DIR = '/tmp/loom-health';

class LoomAgent {
    constructor() {
        this.status = {
            startTime: new Date().toISOString(),
            iterations: 0,
            lastAction: null,
            lastStatus: 'initialized',
            errors: [],
            components: {}
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    async checkHealth() {
        this.log('Running health checks...');
        
        const checks = {
            vite: this.checkVite(),
            playwright: this.checkPlaywright(),
            git: this.checkGit(),
            loom: this.checkLoomEngine()
        };
        
        this.status.components = checks;
        this.status.lastStatus = Object.values(checks).every(c => c.healthy) ? 'healthy' : 'degraded';
        
        return checks;
    }

    checkVite() {
        try {
            const result = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5556', { encoding: 'utf8' });
            const healthy = result.trim() === '200';
            return { healthy, detail: `HTTP ${result.trim()}` };
        } catch (e) {
            return { healthy: false, detail: e.message };
        }
    }

    checkPlaywright() {
        try {
            execSync('npx playwright --version', { cwd: PROJECT_DIR, encoding: 'utf8', stdio: 'pipe' });
            return { healthy: true, detail: 'Playwright available' };
        } catch (e) {
            return { healthy: false, detail: 'Playwright check failed' };
        }
    }

    checkGit() {
        try {
            const result = execSync('git status --short', { cwd: PROJECT_DIR, encoding: 'utf8' });
            const changedFiles = result.trim().split('\n').filter(f => f).length;
            return { healthy: true, detail: `${changedFiles} files changed` };
        } catch (e) {
            return { healthy: false, detail: 'Git check failed' };
        }
    }

    checkLoomEngine() {
        try {
            const result = execSync('python3 -c "import sys; sys.path.insert(0, \'/sandbox/.openclaw-data/workspace/loom\'); from loom.engine import scan_failures; print(\'OK\')"', { encoding: 'utf8' });
            return { healthy: result.includes('OK'), detail: 'Loom engine operational' };
        } catch (e) {
            return { healthy: false, detail: 'Loom engine check failed' };
        }
    }

    runTests(testFile) {
        this.log(`Running tests for ${testFile}...`);
        this.status.lastAction = `running_tests:${testFile}`;
        
        try {
            const result = execSync(
                `npx playwright test ${testFile} --project full --workers 1 --reporter list`,
                { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 300000 }
            );
            
            // Parse results
            const passed = (result.match(/✓/g) || []).length;
            const failed = (result.match(/✗/g) || []).length;
            
            this.log(`Test results: ${passed} passed, ${failed} failed`);
            return { passed, failed };
        } catch (e) {
            this.log(`Test run failed: ${e.message}`, 'error');
            this.status.errors.push(e.message);
            return { passed: 0, failed: 0, error: e.message };
        }
    }

    healVite() {
        this.log('Attempting to heal Vite server...');
        this.status.lastAction = 'healing_vite';
        
        try {
            // Kill existing Vite processes
            execSync('pkill -f vite', { encoding: 'utf8' });
            setTimeout(() => {
                execSync('nohup npx vite --port 5556 --host 0.0.0.0 &>/dev/null &', { encoding: 'utf8' });
            }, 2000);
            
            return { success: true, message: 'Vite healing initiated' };
        } catch (e) {
            this.log(`Vite healing failed: ${e.message}`, 'error');
            return { success: false, message: e.message };
        }
    }

    saveStatus() {
        const statusPath = path.join(PROJECT_DIR, '.loom-agent-status.json');
        fs.writeFileSync(statusPath, JSON.stringify(this.status, null, 2));
        this.log(`Status saved to ${statusPath}`);
    }

    async run() {
        this.log('Starting Loom Agent...');
        
        // Check health first
        const health = await this.checkHealth();
        
        if (!health.vite.healthy) {
            this.healVite();
        }
        
        // Run tests for the files we know have issues
        const testFiles = [
            'tests/e2e/history-persistence.spec.ts'
        ];
        
        for (const testFile of testFiles) {
            const result = this.runTests(testFile);
            if (result.error) {
                this.log(`Failed to run ${testFile}`, 'error');
            }
        }
        
        this.status.endTime = new Date().toISOString();
        this.saveStatus();
        
        this.log('Loom Agent run complete');
    }
}

// Run the agent
const agent = new LoomAgent();
agent.run().catch(console.error);
