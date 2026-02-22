const fs = require('fs');
const path = require('path');

function cleanText(value) {
  return value
    .replace(/\r/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFilePath(filePath) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(process.cwd(), filePath);
}

function parseUsmleQuestions(filePath) {
  const resolvedPath = normalizeFilePath(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Question source file not found: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf8');
  const blocks = content.split(/(?=Question\s+\d+)/g);
  const questions = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block.startsWith('Question')) continue;

    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    // Remove the "Question N" prefix from the first line
    if (lines.length && /^Question\s+\d+/i.test(lines[0])) {
      lines.shift();
    }

    if (!lines.length) continue;

    // Identify where options begin (supports "A. text" and "(A) text")
    const optionStartIndex = lines.findIndex(line =>
      /^\(?[A-J]\)?[.)]\s+/.test(line)
    );

    if (optionStartIndex === -1) continue;

    const questionText = cleanText(lines.slice(0, optionStartIndex).join(' '));
    if (!questionText) continue;

    const remainder = lines.slice(optionStartIndex);
    const options = [];
    const optionLetters = [];
    let explanation = '';
    let correctLetter = null;
    let capturingExplanation = false;

    for (const line of remainder) {
      if (/^Explanation\s*:?/i.test(line)) {
        capturingExplanation = true;
        explanation = cleanText(line.replace(/^Explanation\s*:?/i, ''));
        continue;
      }

      if (capturingExplanation) {
        if (/^(__+|Question\s+\d+)/i.test(line)) break;
        explanation = cleanText(`${explanation} ${line}`);
        continue;
      }

      const correctMatch = line.match(/Correct\s+Answer\s*:?\s*([A-J])/i);
      if (correctMatch) {
        correctLetter = correctMatch[1].toUpperCase();
        continue;
      }

      const optionMatch = line.match(/^\(?([A-J])\)?[.)]\s+(.+)$/);
      if (optionMatch) {
        optionLetters.push(optionMatch[1].toUpperCase());
        options.push(cleanText(optionMatch[2]));
      }
    }

    if (!options.length || !correctLetter) continue;

    const correctIndex = optionLetters.indexOf(correctLetter);
    if (correctIndex === -1) continue;

    questions.push({
      questionText,
      options,
      correctOptionIndex: correctIndex,
      explanation: explanation || ''
    });
  }

  return questions;
}

module.exports = {
  parseUsmleQuestions
};
