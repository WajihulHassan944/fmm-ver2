import { useRouter } from 'next/router';
import React, { useState } from 'react';

const AddNewBlog = () => {
  const [loading, setLoading] = useState(false);
 const router = useRouter();
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [header, setHeader] = useState('');
  const [blogHeaderImage, setBlogHeaderImage] = useState(null);
  const [sections, setSections] = useState([
    {
      title: '',
      content: '',
      image: null,
      headings: [{ title: '', content: '' }]
    }
  ]);

  const handleSectionChange = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleSectionImageChange = (index, file) => {
    const updated = [...sections];
    updated[index].image = file;
    setSections(updated);
  };

  const handleHeadingChange = (sectionIndex, headingIndex, field, value) => {
    const updated = [...sections];
    updated[sectionIndex].headings[headingIndex][field] = value;
    setSections(updated);
  };

  const addSection = () => {
    setSections([
      ...sections,
      { title: '', content: '', image: null, headings: [{ title: '', content: '' }] }
    ]);
  };

  const addHeading = (sectionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].headings.push({ title: '', content: '' });
    setSections(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('metaTitle', metaTitle);
    formData.append('metaDescription', metaDescription);
    formData.append('header', header);
    if (blogHeaderImage) formData.append('blogHeaderImage', blogHeaderImage);

    const sectionData = sections.map(({ title, content, headings, image }) => ({
      title,
      content,
      headings
    }));

    formData.append('sections', JSON.stringify(sectionData));
    sections.forEach((section) => {
      if (section.image) {
        formData.append('sectionImages', section.image);
      }
    });
    
    try {
      const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/create-blog', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to submit blog');

      const data = await res.json();
      alert('Blog created successfully!');
      console.log('Response:', data);
      router.push('/administration/blogs');
    } catch (err) {
      console.error(err);
      alert('An error occurred while submitting the blog.');
    }finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminAddBlog container mx-auto p-6 max-w-4xl addNewMatch">
      <h2 className="adminAddBlog-title text-2xl font-bold mb-4">Add New Blog</h2>
      <form onSubmit={handleSubmit} className="adminAddBlog-form space-y-6">
        <input
          type="text"
          placeholder="Meta Title"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          className="adminAddBlog-metaTitle border p-2 w-full"
          required
        />
        <textarea
          placeholder="Meta Description"
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          className="adminAddBlog-metaDescription border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="Header"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          className="adminAddBlog-header border p-2 w-full"
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setBlogHeaderImage(e.target.files[0])}
          className="adminAddBlog-headerImage block"
          required
        />

        {sections.map((section, idx) => (
          <div key={idx} className="adminAddBlog-section border p-4 rounded space-y-4">
            <h3 className="adminAddBlog-sectionTitle font-semibold text-lg">Section {idx + 1}</h3>
            <input
              type="text"
              placeholder="Section Title"
              value={section.title}
              onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
              className="adminAddBlog-sectionInput border p-2 w-full"
              required
            />
            <textarea
              placeholder="Section Content"
              value={section.content}
              onChange={(e) => handleSectionChange(idx, 'content', e.target.value)}
              className="adminAddBlog-sectionContent border p-2 w-full"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleSectionImageChange(idx, e.target.files[0])}
              className="adminAddBlog-sectionImage block"
              
            />

            {section.headings.map((heading, hIdx) => (
              <div key={hIdx} className="adminAddBlog-heading pl-4 space-y-2">
                <input
                  type="text"
                  placeholder={`Heading ${hIdx + 1} Title`}
                  value={heading.title}
                  onChange={(e) => handleHeadingChange(idx, hIdx, 'title', e.target.value)}
                  className="adminAddBlog-headingTitle border p-2 w-full"
                />
                <textarea
                  placeholder={`Heading ${hIdx + 1} Content`}
                  value={heading.content}
                  onChange={(e) => handleHeadingChange(idx, hIdx, 'content', e.target.value)}
                  className="adminAddBlog-headingContent border p-2 w-full"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => addHeading(idx)}
              className="adminAddBlog-addHeading bg-blue-500 text-white px-3 py-1 rounded"
            >
              + Add Heading
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addSection}
          className="adminAddBlog-addSection bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Section
        </button>

        <button
        type="submit"
        className="adminAddBlog-submit bg-black text-white px-6 py-2 rounded"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit Blog'}
      </button>
      </form>
    </div>
  );
};

export default AddNewBlog;
