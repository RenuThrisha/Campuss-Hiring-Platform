const Student = require("../models/studentModel");
const Company = require("../models/companyModel");
const College = require("../models/collegeModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
        expiresIn: "1d",
    });
};

exports.studentLogin = async (req, res) => {
    try {
        const { rollNo, password } = req.body;
         console.log("BODY =", req.body);
        if (!rollNo || !password) {
            return res.status(400).json({
                message: "Roll number and password are required",
            });
        }

        const student = await Student.findOne({ rollNo }).select("+password");

        if (!student) {
            return res.status(401).json({
                message: "Invalid roll number or password",
            });
        }

        const isPasswordValid = await student.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid roll number or password",
            });
        }

        if (!student.isApproved) {
            return res.status(403).json({
                message: "Your account is pending approval by the college administrator. Please contact your department.",
            });
        }

        const token = generateToken({
            id: student._id,
            rollNo: student.rollNo,
            role: "STUDENT",
            department: student.department,
        });

        res.status(200).json({
            message: "Login successful",
            token,
            student: {
                id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                email: student.email,
                department: student.department,
                year: student.year,
                isApproved: student.isApproved,
                role: "STUDENT",
            },
        });
    } catch (err) {
        console.error("Error in student login:", err);
        res.status(500).json({
            message: "Error logging in",
            error: err.message,
        });
    }
};

exports.collegeLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const college = await College.findOne({ "users.email": email });

        if (!college) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const user = college.users.find((u) => u.email === email);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = generateToken({
            id: user._id || email,
            email: user.email,
            role: user.role,
            department: user.department,
            collegeName: college.collegeName,
        });

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                college: college.collegeName,
            },
        });
    } catch (err) {
        console.error("Error in college login:", err);
        res.status(500).json({
            message: "Error logging in",
            error: err.message,
        });
    }
};

exports.studentRegister = async (req, res) => {
    try {
        const { name, email, password, collegeId, department, year, cgpa, rollNo } = req.body;

        if (!name || !email || !password || !collegeId || !department || !year || !rollNo) {
            return res.status(400).json({
                message: "Name, email, password, collegeId, department, year, and rollNo are required",
            });
        }

        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({
                message: "Student with this email already exists",
            });
        }

        const existingRoll = await Student.findOne({ rollNo });
        if (existingRoll) {
            return res.status(409).json({
                message: "Student with this roll number already exists",
            });
        }

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({
                message: "College not found",
            });
        }

        const newStudent = new Student({
            name,
            email,
            password,
            college: collegeId,
            department,
            year,
            cgpa: cgpa || 0,
            rollNo,
            isApproved: false,
        });

        await newStudent.save();

        const token = generateToken({
            id: newStudent._id,
            rollNo: newStudent.rollNo,
            role: "STUDENT",
            department: newStudent.department,
        });

        res.status(201).json({
            message: "Student registered successfully. Access pending approval.",
            token,
            student: {
                id: newStudent._id,
                name: newStudent.name,
                rollNo: newStudent.rollNo,
                email: newStudent.email,
                department: newStudent.department,
                year: newStudent.year,
                isApproved: false,
                role: "STUDENT",
            },
        });
    } catch (err) {
        console.error("Error in student registration:", err);
        res.status(500).json({
            message: "Error registering student",
            error: err.message,
        });
    }
};   

exports.companyRegister = async (req, res) => {
    try {
        const { companyName, email, password, website, description } = req.body;

        if (!companyName || !email || !password) {
            return res.status(400).json({
                message: "companyName, email, and password are required",
            });
        }

        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(409).json({
                message: "Company with this email already exists",
            });
        }

        const newCompany = new Company({
            companyName,
            email,
            password,
            website,
            description,
        });

        await newCompany.save();

        const token = generateToken({
            id: newCompany._id,
            email: newCompany.email,
            role: "COMPANY",
        });

        res.status(201).json({
            message: "Company registered successfully",
            token,
            company: {
                id: newCompany._id,
                companyName: newCompany.companyName,
                email: newCompany.email,
                role: "COMPANY",
            },
        });
    } catch (err) {
        console.error("Error in company registration:", err);
        res.status(500).json({
            message: "Error registering company",
            error: err.message,
        });
    }
};


exports.collegeRegister = async (req, res) => {
    try {
        const { collegeName, email, password, name, departments, collegeCode } = req.body;
        if (!collegeName || !email || !password || !name || !collegeCode) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingCollege = await College.findOne({ "users.email": email });
        if (existingCollege) return res.status(409).json({ message: "College user already exists" });

        const existingCode = await College.findOne({ collegeCode });
        if (existingCode) return res.status(409).json({ message: "College code already exists" });

        const newCollege = new College({
            collegeName,
            collegeCode,
            departments: departments || [],
            users: [{ name, email, password, role: "PRINCIPAL" }]
        });

        await newCollege.save();
        res.status(201).json({ message: "College registered successfully" });
    } catch (err) {
        console.error("Error in college registration:", err);
        res.status(500).json({ message: "Error registering college", error: err.message });
    }
};

exports.companyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const company = await Company.findOne({ email }).select("+password");

        if (!company) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await company.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const token = generateToken({
            id: company._id,
            email: company.email,
            role: "COMPANY",
        });

        res.status(200).json({
            message: "Login successful",
            token,
            company: {
                id: company._id,
                companyName: company.companyName,
                email: company.email,
                role: "COMPANY",
            },
        });
    } catch (err) {
        console.error("Error in company login:", err);
        res.status(500).json({
            message: "Error logging in",
            error: err.message,
        });
    }
};

exports.getColleges = async (req, res) => {
    try {
        const colleges = await College.find({}, "collegeName collegeCode departments");
        res.status(200).json({ colleges });
    } catch (err) {
        console.error("Error fetching colleges:", err);
        res.status(500).json({ message: "Error fetching colleges", error: err.message });
    }
};

exports.createCollege = async (req, res) => {
    try {
        const { collegeName, departments, users } = req.body;
        const newCollege = new College({ collegeName, departments, users });
        await newCollege.save();
        res.status(201).json({ message: "College created", college: newCollege });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
