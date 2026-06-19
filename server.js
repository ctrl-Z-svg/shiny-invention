import 'dotenv/config';

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: GROQ_API_KEY });

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY environment variable is not set.' });
  }

  const { topic, prompt, answerStyle = 'detailed', includeExample = false } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Please provide a question.' });
  }

  const styleInstructions =
    answerStyle === 'step-by-step'
      ? 'Respond with a clear step-by-step explanation, using numbered or ordered steps where helpful.'
      : answerStyle === 'summary'
      ? 'Respond with a short summary that focuses on the core idea.'
      : 'Respond with a complete, friendly explanation that helps the student understand the concept.';

  const exampleInstructions = includeExample
    ? 'Include a simple example if it helps clarify the idea.'
    : 'Do not add an extra example unless it is essential for understanding.';

  try {
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
    const messages = [
      {
        role: 'system',
        content: 'You are a friendly student tutor. Answer clearly in plain text. Do not use LaTeX, markdown, code blocks, or any math notation like \( \), \[ \], \frac, \sqrt, or \boxed. Use only normal keyboard characters and explain formulas with words and simple symbols like +, -, *, /, =. If the answer is long, continue until the explanation is complete and finish the last sentence.'
      },
      {
        role: 'user',
        content: `Subject: ${topic}\nAnswer style: ${answerStyle}\nInclude example: ${includeExample ? 'yes' : 'no'}\n${styleInstructions} ${exampleInstructions}\nQuestion: ${prompt}`
      }
    ];

    const completion = await groq.chat.completions.create({
      model,
      messages,
      max_completion_tokens: 500,
      temperature: 0.22,
      response_format: { type: 'text' }
    });

    const extractAnswer = (completion) => {
      const choice = completion.choices?.[0];
      if (!choice) return '';

      const message = choice.message;
      if (message) {
        if (typeof message.content === 'string' && message.content.trim()) {
          return message.content.trim();
        }
        if (Array.isArray(message.content)) {
          return message.content
            .map((item) => (typeof item === 'string' ? item : item?.text || ''))
            .filter(Boolean)
            .join('')
            .trim();
        }
      }

      if (typeof choice.text === 'string' && choice.text.trim()) {
        return choice.text.trim();
      }

      if (Array.isArray(choice.output)) {
        return choice.output
          .map((item) => item?.content?.map((c) => c?.text).filter(Boolean).join('') || '')
          .filter(Boolean)
          .join('\n')
          .trim();
      }

      return '';
    };

    let answer = extractAnswer(completion).trim();

    // Check if answer was cut off by token limit
    if (completion.choices?.[0]?.finish_reason === 'length') {
      answer += '\n\n[Note: Answer was cut off due to length. Try asking a more specific question.]';
    }

    if (!answer) {
      console.error('Empty answer from Groq completion:', JSON.stringify(completion, null, 2));
      return res.status(500).json({ error: 'The Groq model returned no answer text. Try again.' });
    }

    return res.json({ answer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to get a response from Groq.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});