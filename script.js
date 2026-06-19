
const topicSelect = document.getElementById('topic');
const questionInput = document.getElementById('question');
const helpBtn = document.getElementById('helpBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const answerBox = document.getElementById('answer');
const historyList = document.getElementById('historyList');
const historyContent = document.querySelector('.history-content');

const loader = '<p>Getting your answer…</p>';
const historyItems = [];

const renderHistory = () => {
  if (historyItems.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No questions yet. Ask something above.</li>';
    return;
  }

  historyList.innerHTML = historyItems
    .slice(0, 5)
    .map((item) => `
      <li>
        <strong>Q:</strong> ${item.question}<br>
        <strong>A:</strong> ${item.answer.replace(/\n/g, '<br>')}
      </li>
    `)
    .join('');
};

helpBtn.addEventListener('click', async () => {
  const topic = topicSelect.value;
  const prompt = questionInput.value.trim();

  if (!prompt) {
    answerBox.innerHTML = '<p>Please enter a question so the homework helper can give you a useful answer.</p>';
    return;
  }

  answerBox.innerHTML = loader;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, prompt })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed.');
    }

    answerBox.textContent = data.answer;
    historyItems.unshift({ question: prompt, answer: data.answer });
    renderHistory();
  } catch (error) {
    answerBox.innerHTML = `<p>Sorry, something went wrong: ${error.message}</p>`;
  }
});

clearBtn.addEventListener('click', () => {
  questionInput.value = '';
  answerBox.innerHTML = '<p>Enter your question and select a subject to get started.</p>';
});

historyToggleBtn.addEventListener('click', () => {
  const hidden = historyContent.classList.toggle('hidden');
  historyToggleBtn.textContent = hidden ? 'Show history' : 'Hide history';
});

clearHistoryBtn.addEventListener('click', () => {
  historyItems.length = 0;
  renderHistory();
});

copyBtn.addEventListener('click', async () => {
  const text = answerBox.textContent || '';
  if (!text.trim()) return;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy Answer'; }, 1200);
  } catch (err) {
    alert('Unable to copy answer.');
  }
});

renderHistory();
