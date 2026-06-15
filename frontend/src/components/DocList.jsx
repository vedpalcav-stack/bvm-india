import React from "react";

function DocList({ documents = [] }) {
  return (
    <div>
      <h2>Document List</h2>

      {documents.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <ul>
          {documents.map((doc, index) => (
            <li key={index}>
              <strong>{doc.title}</strong> - {doc.author}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DocList;
