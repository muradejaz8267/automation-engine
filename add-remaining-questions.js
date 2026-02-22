const fs = require('fs');

// Read extracted questions
const data = fs.readFileSync('extracted-questions.js', 'utf8');
const match = data.match(/const quizQuestions = \[([\s\S]*?)\];/);

if (match) {
  const questions = eval('[' + match[1] + ']');
  const remaining = questions.slice(50); // Questions 51-95 (indices 50-94)
  
  // Format questions with single quotes
  const formatted = remaining.map(q => {
    // Convert question text - escape single quotes
    const questionText = q.questionText.replace(/'/g, "\\'");
    
    // Format options - escape single quotes
    const opts = q.options.map(o => {
      const escaped = o.replace(/'/g, "\\'");
      return `          '${escaped}'`;
    }).join(',\n');
    
    return `      {
        questionText: '${questionText}',
        options: [
${opts}
        ],
        correctOptionIndex: ${q.correctOptionIndex}
      }`;
  }).join(',\n\n');
  
  console.log(formatted);
}

