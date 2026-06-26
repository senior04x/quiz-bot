const fs = require('fs');
const path = require('path');

function parseContent(text) {
    if (text.includes('+++++')) {
        const blocks = text.split(/\s*\+{3,}\s*/).filter(b => b.trim().length > 0);
        return blocks.map(block => {
            const parts = block.split(/\s*={3,}\s*/).map(p => p.trim()).filter(p => p.length > 0);
            const question = parts[0];
            
            let hasHash = false;
            let correctIndex = 0;
            const options = parts.slice(1).map((opt, idx) => {
                const isCorrect = /^\s*#/.test(opt);
                if (isCorrect) {
                    hasHash = true;
                    correctIndex = idx;
                }
                const cleanText = opt.replace(/^\s*#/, '').trim();
                return { text: cleanText, isCorrect: isCorrect, originalIndex: idx };
            });

            if (!hasHash && options.length > 0) {
                options[0].isCorrect = true;
                correctIndex = 0;
            }

            return { question, options, correctIndex };
        });
    } else {
        const lines = text.split(/\r?\n/);
        const questions = [];
        let currentQuestion = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if (/^#\d+\./.test(line)) {
                if (currentQuestion) {
                    questions.push(currentQuestion);
                }
                currentQuestion = {
                    question: line.replace(/^#\d+\.\s*/, '').trim(),
                    options: [],
                    correctIndex: 0
                };
            } else if (currentQuestion && (line.startsWith('+') || line.startsWith('-'))) {
                const isCorrect = line.startsWith('+');
                const cleanText = line.substring(1).trim();
                
                if (isCorrect) {
                    currentQuestion.correctIndex = currentQuestion.options.length;
                }
                currentQuestion.options.push({
                    text: cleanText,
                    isCorrect: isCorrect,
                    originalIndex: currentQuestion.options.length
                });
            }
        }
        if (currentQuestion) {
            questions.push(currentQuestion);
        }
        return questions;
    }
}

function loadAllTests() {
    const testsDir = path.join(__dirname, 'tests');
    if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir);
    }
    const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.md'));
    const result = {};
    for (const file of files) {
        const filePath = path.join(testsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        result[file] = parseContent(content);
    }
    return result;
}

module.exports = { loadAllTests, parseContent };
