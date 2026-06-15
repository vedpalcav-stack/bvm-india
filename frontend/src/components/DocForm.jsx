import React, { useState } from "react";

function DocForm() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Document Data:", formData);
    alert("Document Saved!");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "20px auto" }}>
      <h2>Create Document</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Title</label>
          <br />
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Description</label>
          <br />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Author</label>
          <br />
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <button type="submit">
          Save Document
        </button>
      </form>
    </div>
  );
}

export default DocForm;

