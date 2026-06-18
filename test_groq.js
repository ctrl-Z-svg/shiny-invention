// Simple Groq test script using the official Groq JavaScript SDK
// Usage (PowerShell):
//  $env:GROQ_API_KEY = "YOUR_KEY";
//  node test_groq.js "Explain Pythagorean theorem in simple terms"

import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY environment variable.');
  process.exit(2);
}

const prompt = process.argv.slice(2).join(' ') || 'Give a short friendly study tip for math students.';
const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const groq = new Groq({ apiKey: GROQ_API_KEY });

(async () => {
  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a friendly student tutor. Answer clearly in plain text. Do not use LaTeX, markdown, code blocks, or any math notation like \\( \\), \\[ \\], \\frac, \\sqrt, or \\boxed. Use only normal keyboard characters and explain formulas with words and simple symbols like +, -, *, /, =.'
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 260,
      temperature: 0.6
    });

    console.log('Completion response:');
    console.log(JSON.stringify(completion, null, 2));

    const answer = completion.choices?.[0]?.message?.content || completion.choices?.[0]?.text || JSON.stringify(completion);
    console.log('\n== Extracted Answer ==\n', answer);
    process.exit(0);
  } catch (err) {
    console.error('Request failed:', err.stack || err.message || err);
    process.exit(1);
  }
})();
