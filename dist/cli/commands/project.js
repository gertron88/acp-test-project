"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectCommands = void 0;
const chalk_1 = __importDefault(require("chalk"));
const project_js_1 = require("../../core/project.js");
exports.projectCommands = {
    init: async () => {
        try {
            const projectPath = process.cwd();
            await (0, project_js_1.initProject)(projectPath);
            console.log(chalk_1.default.green('✓'), 'Initialized ACP in current directory\n');
            console.log(chalk_1.default.bold('Next steps:'));
            console.log(chalk_1.default.gray('  1. Create a slot:'), chalk_1.default.cyan('acp slot create backend-dev-1 --role=backend-developer'));
            console.log(chalk_1.default.gray('  2. Commit the slot:'), chalk_1.default.cyan('git add .acp/ && git commit -m "Add ACP config"'));
            console.log(chalk_1.default.gray('  3. Agent claims slot:'), chalk_1.default.cyan('acp-agent claim-slot backend-dev-1 --provider=openclaw'));
            console.log(chalk_1.default.gray('  4. Create a task:'), chalk_1.default.cyan('acp task create --title="Implement auth" --assign=backend-dev-1'));
            console.log();
        }
        catch (error) {
            console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }
};
//# sourceMappingURL=project.js.map