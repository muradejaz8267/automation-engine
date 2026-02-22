const fs = require('fs');
const path = require('path');

// Questions to skip
const skipQuestions = [2, 9, 19, 21, 28, 35, 41, 44, 51, 53, 59, 63, 65, 68, 70, 72, 79, 88, 90, 92, 96, 102, 116];

// Answer key mapping
const answerKey = {
  1: 'A', 3: 'B', 4: 'A', 5: 'D', 6: 'E', 7: 'C', 8: 'A', 10: 'A',
  11: 'C', 12: 'B', 13: 'F', 14: 'C', 15: 'B', 16: 'B', 17: 'E', 18: 'D', 20: 'D',
  22: 'A', 23: 'D', 24: 'B', 25: 'B', 26: 'D', 27: 'C', 29: 'B', 30: 'D',
  31: 'D', 32: 'E', 33: 'D', 34: 'A', 36: 'C', 37: 'D', 38: 'E', 39: 'B', 40: 'D',
  42: 'A', 43: 'C', 45: 'C', 46: 'B', 47: 'A', 48: 'A', 49: 'B', 50: 'D',
  52: 'B', 54: 'B', 55: 'E', 56: 'D', 57: 'C', 58: 'E', 60: 'E',
  61: 'D', 62: 'A', 64: 'B', 66: 'C', 67: 'C', 69: 'C', 71: 'A',
  73: 'A', 74: 'A', 75: 'E', 76: 'C', 77: 'D', 78: 'C', 80: 'E',
  81: 'D', 82: 'D', 83: 'B', 84: 'C', 85: 'C', 86: 'A', 87: 'D', 89: 'C',
  91: 'D', 93: 'C', 94: 'D', 95: 'E', 97: 'B', 98: 'B', 99: 'E', 100: 'E',
  101: 'D', 103: 'E', 104: 'A', 105: 'E', 106: 'C', 107: 'E', 108: 'B', 109: 'D', 110: 'D',
  111: 'E', 112: 'B', 113: 'F', 114: 'A', 115: 'E', 117: 'E', 118: 'A', 119: 'D'
};

// Map answer letter to index (A=0, B=1, C=2, D=3, E=4, F=5)
function letterToIndex(letter) {
  const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9 };
  return map[letter] || 0;
}

function extractQuestions() {
  const txtPath = path.join(__dirname, 'Step_1.txt');
  
  if (!fs.existsSync(txtPath)) {
    console.error(`Text file not found at: ${txtPath}`);
    return;
  }

  console.log('Extracting questions from Step_1.txt...');
  
  const text = fs.readFileSync(txtPath, 'utf8');
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const questions = [];
  let i = 0;
  
  // Find start - look for "1." pattern
  while (i < lines.length && !lines[i].match(/^1\.\s/)) {
    i++;
  }
  
  console.log(`Starting extraction from line ${i}`);
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Look for question numbers: "1.", "2.", etc.
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (questionMatch) {
      const questionNum = parseInt(questionMatch[1]);
      
      // Validate question number (1-119)
      if (questionNum < 1 || questionNum > 119) {
        i++;
        continue;
      }
      
      // Skip if in skip list
      if (skipQuestions.includes(questionNum)) {
        console.log(`Skipping Q${questionNum}`);
        i++;
        continue;
      }
      
      // Get answer from answer key
      const answerLetter = answerKey[questionNum];
      if (!answerLetter) {
        console.warn(`No answer found for question ${questionNum}`);
        i++;
        continue;
      }
      
      // Extract question text (may span multiple lines)
      let questionText = questionMatch[2];
      i++;
      
      // Continue reading question text until we hit an option
      while (i < lines.length) {
        const nextLine = lines[i];
        
        // Check if this is an option (starts with (A), (B), etc.)
        if (nextLine.match(/^\([A-J]\)\s/)) {
          break;
        }
        
        // Check if this is the next question
        if (nextLine.match(/^\d+\.\s/)) {
          break;
        }
        
        // Add to question text if substantial
        if (nextLine.length > 2) {
          questionText += ' ' + nextLine;
        }
        
        i++;
      }
      
      questionText = questionText.trim();
      
      // Extract options
      const options = [];
      while (i < lines.length && options.length < 10) {
        const optionLine = lines[i];
        
        // Match option: (A) text
        const optionMatch = optionLine.match(/^\(([A-J])\)\s*(.+)/);
        if (optionMatch) {
          let optionText = optionMatch[2].trim();
          i++;
          
          // Continue reading option text until next option or question
          while (i < lines.length) {
            const nextLine = lines[i];
            
            // Stop if we hit another option or question
            if (nextLine.match(/^\([A-J]\)\s/) || nextLine.match(/^\d+\.\s/)) {
              break;
            }
            
            // Add continuation if substantial
            if (nextLine.length > 2) {
              optionText += ' ' + nextLine;
            }
            
            i++;
          }
          
          const cleaned = optionText.trim();
          if (cleaned.length > 0) {
            options.push(cleaned);
          }
        } else if (optionLine.match(/^\d+\.\s/)) {
          // Next question found
          break;
        } else {
          i++;
        }
      }
      
      if (questionText.length > 20 && options.length >= 2) {
        questions.push({
          questionNum: questionNum,
          questionText: questionText,
          options: options,
          correctOptionIndex: letterToIndex(answerLetter)
        });
        console.log(`✓ Q${questionNum}: ${questionText.substring(0, 70)}... (${options.length} options, answer: ${answerLetter})`);
      } else {
        console.warn(`⚠ Q${questionNum}: incomplete - text=${questionText.length} chars, options=${options.length}`);
      }
    } else {
      i++;
    }
  }
  
  console.log(`\n✅ Extracted ${questions.length} questions`);
  
  // Generate JavaScript array format
  const jsArray = questions.map(q => {
    const optionsStr = q.options.map(opt => {
      const escaped = opt.replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      return `          '${escaped}'`;
    }).join(',\n');
    const questionEscaped = q.questionText.replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return `      {\n        questionText: '${questionEscaped}',\n        options: [\n${optionsStr}\n        ],\n        correctOptionIndex: ${q.correctOptionIndex}\n      }`;
  }).join(',\n\n');
  
  // Write to file
  const outputPath = path.join(__dirname, 'extracted-questions.js');
  const output = `// Extracted questions from Step_1.txt\n// Skipped questions: ${skipQuestions.join(', ')}\nconst quizQuestions = [\n${jsArray}\n    ];`;
  
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`\n✅ Written ${questions.length} questions to ${outputPath}`);
  
  return questions;
}

extractQuestions();

