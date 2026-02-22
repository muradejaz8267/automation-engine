const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

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

function letterToIndex(letter) {
  const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9 };
  return map[letter] || 0;
}

async function extractQuestions() {
  const docxPath = path.join(__dirname, 'Step_1.docx');
  
  if (!fs.existsSync(docxPath)) {
    console.error(`DOCX file not found at: ${docxPath}`);
    return;
  }

  console.log('Extracting questions from DOCX...');
  
  try {
    const result = await mammoth.extractRawText({ path: docxPath });
    const text = result.value;
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const questions = [];
    let questionCounter = 0; // Track which question we're on (excluding skipped ones)
    let i = 0;
    
    // Find start - look for first question pattern
    while (i < lines.length) {
      // Look for question patterns: starts with "A [number]-year-old" or "Which of the following"
      if (lines[i].match(/^A\s+\d+-year-old/) || lines[i].match(/^Which of the following/) || 
          (lines[i].match(/^[A-Z]/) && lines[i].length > 50 && lines[i].match(/(year-old|comes to|is brought)/))) {
        break;
      }
      i++;
    }
    
    console.log(`Starting extraction from line ${i}`);
    
    while (i < lines.length && questionCounter < 200) {
      const line = lines[i];
      
      // Check if this looks like a question start
      const isQuestionStart = line.match(/^A\s+\d+-year-old/) || 
                             line.match(/^Which of the following/) ||
                             line.match(/^[A-Z][^.]{30,}comes to/) ||
                             line.match(/^[A-Z][^.]{30,}is brought to/);
      
      if (isQuestionStart) {
        questionCounter++;
        let questionNum = questionCounter;
        
        // Adjust for skipped questions
        while (skipQuestions.includes(questionNum)) {
          questionNum++;
          questionCounter++;
        }
        
        // Validate question number
        if (questionNum > 119) break;
        
        const answerLetter = answerKey[questionNum];
        if (!answerLetter) {
          console.warn(`No answer for Q${questionNum}, skipping`);
          i++;
          continue;
        }
        
        // Extract question text
        let questionText = line;
        i++;
        
        // Continue reading question until we hit an option
        while (i < lines.length) {
          const nextLine = lines[i];
          
          // Check if this is an option
          if (nextLine.match(/^\([A-J]\)\s/) || (nextLine === '(A)' || nextLine === '(B)' || nextLine.match(/^\([A-J]\)$/))) {
            break;
          }
          
          // Check if this is next question
          if (nextLine.match(/^A\s+\d+-year-old/) || nextLine.match(/^Which of the following/)) {
            break;
          }
          
          // Add to question if substantial
          if (nextLine.length > 3 && !nextLine.match(/^(USMLE|Block|Page|CONTENTS|Answer|Sample Test|Laboratory)/i)) {
            questionText += ' ' + nextLine;
          }
          
          i++;
        }
        
        questionText = questionText.trim();
        
        // Extract options
        const options = [];
        const stopPatterns = [
          /^A\s+\d+-year-old/,
          /^Which of the following/,
          /^USMLE\s+STEP\s+1/,
          /^BLOCK\s+\d+/,
          /^Answer\s+Form/,
          /^Answer\s+Key/,
          /^Laboratory\s+Values/i,
          /^CONTENTS/i
        ];
        
        while (i < lines.length && options.length < 10) {
          const optionLine = lines[i];
          
          // Check for stop patterns
          let shouldStop = false;
          for (const pattern of stopPatterns) {
            if (optionLine.match(pattern)) {
              shouldStop = true;
              break;
            }
          }
          if (shouldStop) break;
          
          // Match option: (A) text
          if (optionLine.match(/^\(([A-J])\)\s*(.+)/)) {
            const match = optionLine.match(/^\(([A-J])\)\s*(.+)/);
            let optionText = match[2].trim();
            i++;
            
            // Continue reading option text until next option or stop pattern
            while (i < lines.length) {
              const nextLine = lines[i];
              
              // Check stop patterns
              let shouldBreak = false;
              for (const pattern of stopPatterns) {
                if (nextLine.match(pattern)) {
                  shouldBreak = true;
                  break;
                }
              }
              if (shouldBreak) break;
              
              // Stop if we hit another option
              if (nextLine.match(/^\([A-J]\)/)) {
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
          } else if (optionLine.match(/^\(([A-J])\)$/)) {
            // Option letter on its own line like "(A)"
            i++;
            
            // Get option text from next line(s)
            if (i < lines.length) {
              let optionText = '';
              
              // Read until next option or stop pattern
              while (i < lines.length) {
                const nextLine = lines[i];
                
                // Check stop patterns
                let shouldBreak = false;
                for (const pattern of stopPatterns) {
                  if (nextLine.match(pattern)) {
                    shouldBreak = true;
                    break;
                  }
                }
                if (shouldBreak) break;
                
                // Stop if we hit another option
                if (nextLine.match(/^\([A-J]\)/)) {
                  break;
                }
                
                // Add to option text
                if (nextLine.length > 2) {
                  if (optionText) optionText += ' ';
                  optionText += nextLine;
                }
                
                i++;
              }
              
              const cleaned = optionText.trim();
              if (cleaned.length > 0) {
                options.push(cleaned);
              }
            }
          } else if (optionLine.match(/^\(([A-J])\)\s+\(([A-J])\)/)) {
            // Combined options like "(B) (C)" - these are likely just labels, skip
            i++;
          } else {
            i++;
          }
        }
        
        if (questionText.length > 30 && options.length >= 2) {
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
    const output = `// Extracted questions from Step_1.docx\n// Skipped questions: ${skipQuestions.join(', ')}\nconst quizQuestions = [\n${jsArray}\n    ];`;
    
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`\n✅ Written ${questions.length} questions to ${outputPath}`);
    
    return questions;
  } catch (error) {
    console.error('Error extracting from DOCX:', error);
    throw error;
  }
}

extractQuestions().catch(console.error);
