import { api } from "../api";

const CompanyService = {
  getCompanies: () => {
    return api.get("/api/companies");
  },

  getCompanyById: (id) => {
    return api.get(`/api/companies/${id}`);
  },

  createCompany: (company) => {
    return api.post("/api/companies", company);
  },

  updateCompany: (id, company) => {
    return api.put(`/api/companies/${id}`, company);
  },

  deleteCompany: (id) => {
    return api.delete(`/api/companies/${id}`);
  },
};

export default CompanyService;
