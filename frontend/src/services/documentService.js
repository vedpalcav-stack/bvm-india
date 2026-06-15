import { api } from "../api";

const DocumentService = {
  getDocuments: () => {
    return api.get("/api/documents");
  },

  getDocumentById: (id) => {
    return api.get(`/api/documents/${id}`);
  },

  createDocument: (document) => {
    return api.post("/api/documents", document);
  },

  updateDocument: (id, document) => {
    return api.put(`/api/documents/${id}`, document);
  },

  deleteDocument: (id) => {
    return api.delete(`/api/documents/${id}`);
  },
};

export default DocumentService;
