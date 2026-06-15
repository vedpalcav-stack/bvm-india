import { api } from "../api";

const InventoryService = {
  getInventory: () => {
    return api.get("/api/inventory");
  },

  getInventoryById: (id) => {
    return api.get(`/api/inventory/${id}`);
  },

  createInventory: (item) => {
    return api.post("/api/inventory", item);
  },

  updateInventory: (id, item) => {
    return api.put(`/api/inventory/${id}`, item);
  },

  deleteInventory: (id) => {
    return api.delete(`/api/inventory/${id}`);
  },
};

export default InventoryService;
