app.use("/api/companies", require("./modules/companies/company.routes"));
app.use("/api/customers", require("./modules/customers/customer.routes"));
app.use("/api/products", require("./modules/products/product.routes"));
app.use("/api/inventory", require("./modules/inventory/inventory.routes"));
...

// app.use("/api/companies", require("./modules/companies/company.routes"));
// app.use("/api/customers", require("./modules/customers/customer.routes"));
// app.use("/api/products", require("./modules/products/product.routes"));
// app.use("/api/inventory", require("./modules/inventory/inventory.routes"));
// app.use("/api/quotations", require("./modules/quotations/quotation.routes"));
// app.use("/api/proforma", require("./modules/proforma/proforma.routes"));
// app.use("/api/purchase-orders", require("./modules/purchase-order/po.routes"));
// app.use("/api/sales-orders", require("./modules/sales-order/so.routes"));
// app.use("/api/invoices", require("./modules/invoices/invoice.routes"));
// app.use("/api/dispatch", require("./modules/dispatch/dispatch.routes"));
// app.use("/api/reminders", require("./modules/reminders/reminder.routes"));
