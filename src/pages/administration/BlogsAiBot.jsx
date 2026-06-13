import React, { useState } from 'react';
import { IoSend } from 'react-icons/io5';
import { useRouter } from 'next/router';

const BlogsAiBot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
const parseBlogContent = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  let metaTitle = '';
  let metaDescription = '';
  let header = '';
  const sections = [];

  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^Meta Title[:\-]*/i.test(line)) {
      metaTitle = lines[++i] || '';
    } else if (/^Meta Description[:\-]*/i.test(line)) {
      metaDescription = lines[++i] || '';
    } else if (/^Blog Title\s*\(H1\)[:\-]*/i.test(line)) {
      header = lines[++i] || '';
    } else if (/^Section \d+ Heading\s*\(H2\)[:\-]*/i.test(line)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: lines[++i] || '',
        content: '',
        headings: []
      };
    } else if (/^Section \d+ Text[:\-]*/i.test(line)) {
      currentSection.content = '';
      let j = i + 1;
      while (j < lines.length && !/^Section \d+ Heading\s*\(H2\)|^Conclusion Heading/i.test(lines[j])) {
        currentSection.content += lines[j] + '\n';
        j++;
      }
      i = j - 1;
    } else if (/^Conclusion Heading\s*\(H2\)[:\-]*/i.test(line)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: lines[++i] || 'Conclusion',
        content: '',
        headings: []
      };
    } else if (/^Conclusion Text[:\-]*/i.test(line)) {
      currentSection.content = '';
      let j = i + 1;
      while (j < lines.length) {
        currentSection.content += lines[j] + '\n';
        j++;
      }
      i = j;
    }
  }

  if (currentSection) sections.push(currentSection);

  // Validate and return
  if (!metaTitle || !metaDescription || !header || sections.length === 0) {
    throw new Error('Blog content could not be parsed correctly.');
  }

  return {
    metaTitle: metaTitle.trim(),
    metaDescription: metaDescription.trim(),
    header: header.trim(),
    sections: sections.map(s => ({
      title: s.title.trim(),
      content: s.content.trim(),
      headings: []  // Headings not used here
    }))
  };
};

const postBlogToBackend = async (parsedBlog) => {
  const formData = new FormData();

  formData.append('metaTitle', parsedBlog.metaTitle);
  formData.append('metaDescription', parsedBlog.metaDescription);
  formData.append('header', parsedBlog.header);
  formData.append('sections', JSON.stringify(parsedBlog.sections));

  // No image in AI-generated version, so skip image appending

  const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/create-blog', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Failed to submit blog');
};


  const sendMessage = async () => {
  if (!userInput.trim()) return;

  const newMessages = [...messages, { role: 'user', content: userInput }];
  setMessages(newMessages);
  setUserInput('');
  setLoading(true);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput }),
    });

    const data = await res.json();
    const aiContent = data.reply;

    // Always show message
    newMessages.push({ role: 'assistant', content: aiContent });
    setMessages(newMessages);

    try {
      const parsed = parseBlogContent(aiContent);
      await postBlogToBackend(parsed);
      alert('✅ Blog generated and submitted!');
    } catch (err) {
      console.warn('⚠️ Parsing failed but response shown to user:', err);
      alert('⚠️ Blog was generated but could not be submitted automatically. You can copy it manually.');
    }
  } catch (err) {
    console.error(err);
    alert('❌ ChatGPT failed to respond or network error.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bot-wrapper-blogs">
      <img src="/Assets/RING3.png" className="bg-image" alt="background" />
      <div className="chat-box-blogs">
        <div className="header-ai-blogs">
          <img src="/Assets/bot.png" alt="bot" className="bot-avatar" />
          <div className="bot-intro">
            <h3>Fantasy Mmadness Blogs Ai Bot</h3>
          </div>
        </div>

        <div className="chat-history">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === 'user' ? (
                <div className="user-message">
                  <span>{msg.content}</span>
                </div>
              ) : (
                <div className="bot-message">
                  <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                </div>
              )}
            </div>
          ))}
          {loading && <div className="bot-message"><span>Bot is typing...</span></div>}
        </div>

        <div className="chat-input-blogs-ai">
          <input
            type="text"
            placeholder="Enter blog topic..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>
            <IoSend size={22} color="#333" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogsAiBot;
