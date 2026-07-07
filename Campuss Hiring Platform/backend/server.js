const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./db");
const initCronJobs = require("./cronJobs");
const app = express();

initCronJobs();
app.use(express.json());
app.use(cors());  

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/company", require("./routes/companyRoutes"));
app.use("/api/college", require("./routes/collegeRoutes"));
app.use("/api/common", require("./routes/commonRoutes"));

// Health check
app.get("/", (req, res) => {
  res.send("Campus Hiring Platform Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Force restart 1
