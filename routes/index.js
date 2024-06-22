var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const userModel = require("../models/Usermodel");
const staffModel = require("../models/staff");
const studentModel = require("../models/student");
const courseModel = require("../models/course");
const feesModel = require("../models/fees");
const passport = require("passport");
const localStrategy = require("passport-local");
var fs = require("fs");
const pdfDoc = require("pdfkit");

// function buildPDF(Datacallback, Endcallback) {
//   const doc = new pdfDoc();
//   doc.on("data", Datacallback);
//   doc.on("end", Endcallback);
//   doc.text("Fee Amount: ");

//   doc.end();
// }
function buildPDF(Datacallback, Endcallback) {
  const doc = new pdfDoc();
  doc.on("data", Datacallback);
  doc.on("end", Endcallback);
  // doc.text("Fee Amount: ");

  // doc.on("data", Datacallback);
  // Pipe the document to a file
  // doc.pipe(fs.createWriteStream("receipt.pdf"));

  // Header Section
  doc.fontSize(16).text("MAA COMPUTER EDUCATION INSTITUTE", {
    align: "center",
    underline: true,
  });
  doc.fontSize(12).text("SPOKEN ENGLISH & P.D. CLASSES", { align: "center" });
  doc
    .fontSize(10)
    .text("An ISO 9001: 2015 Certified Institute", { align: "center" });
  // doc
  //   .fontSize(10)
  //   .text("Regd. by Govt. of India (1877/IND/S/2010)", { align: "center" });
  // doc
  //   .fontSize(10)
  //   .text("Run By: Youth Kayastha Education Welfare Society Rau", {
  //     align: "center",
  //   });

  // Branch Info
  doc
    .moveDown()
    .fontSize(10)
    .text("Location: Above Andhra Bank, 2nd Floor, Station Road, Rau")
    // .text("Branch 2: Bohra Colony, Cat Road, Rau M. 9407093676")
    .text("Mobile: +91 9617678702, 9229697696, 9039442551")
    .text("Email: mceiindia229@gmail.com", { underline: true });

  // Receipt Details
  doc
    // .moveDown()
    .fontSize(10)
    // .text("No. 839", 50, 220)
    // .text("Receipt", 400, 220)
    .text("Reg. No.: ..........................................................", 50, 180)
    .text("Date: ..........................................................", 350, 180);

  // Name and Course 
  doc
    .moveDown()
    .text(
      "Name: .............................................................",
      50,
      200
    )
    .text(
      "Course: ......................................................",
      350,
      200
    );

  // Table Header
  doc
    .moveDown()
    .text("S.No.", 50, 340)
    .text("Particulars", 150, 340)
    .text("Amount", 450, 340);

  // Table Rows
  const tableRows = [
    { sno: "1", particulars: "Reg. Fee", amount: "" },
    { sno: "2", particulars: "Monthly Fee", amount: "" },
    { sno: "3", particulars: "Late Fee", amount: "" },
    { sno: "4", particulars: "Exam Fee", amount: "" },
    { sno: "5", particulars: "Other", amount: "" },
  ];

  let y = 360;
  tableRows.forEach((row) => {
    doc
      .text(row.sno, 50, y)
      .text(row.particulars, 150, y)
      .text(row.amount, 450, y);
    y += 20;
  });

  // Total
  doc
    .moveDown()
    .text("Total", 150, y)
    .text(".........................................................", 450, y);

  // Footer Section
  doc
    .moveDown()
    .fontSize(10)
    .text(
      "Received a sum of Rupee ........................................................ by Cash/Cheque No. .............................",
      50,
      y + 40
    )
    .text("Dated ........................................", 50, y + 60)
    .text("For: MCEI", 50, y + 80)
    .text("Receiver's Signature", 400, y + 80);

  // Signature Section
  doc.moveDown().text("Student's/Parent's Signature", 50, y + 120);

  // Logo and Additional Info
  doc
    .image("./public/images/logo.png", 50, y + 160, { width: 100 })
    .fontSize(10)
    // .text("SunRise INTERNATIONAL SCHOOL", 200, y + 160)
    // .text("Run by Y.K. Education Welfare Society, Rau", 200, y + 180)
    // .text("Campus: Bohra Colony, Cat Road, Rau", 200, y + 200)
    .text(
      "Note: Fee is not refundable or transferable in any condition. Late fee is applicable after due date.",
      50,
      y + 220
    );
  doc.on("end", Endcallback);
  doc.end();
}

passport.use(new localStrategy(userModel.authenticate()));
mongoose
  .connect("mongodb://0.0.0.0/mark")
  .then(() => {})
  .catch((err) => {
    err;
  });
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/invoice", (req, res, next) => {
  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment;filename=receipt.pdf`,
  });
  buildPDF(
    (chunk) => stream.write(chunk),
    () => stream.end()
  );
});

router.get("/signup", function (req, res, next) {
  res.render("signup");
});
router.post("/register", function (req, res) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email,
  });
  userModel
    .register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    })
    .catch((e) => {
      console.log(e);
      res.redirect("/signup");
    });
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "dashboard",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);
router.get("/logout", function (req, res, next) {
  req.logOut();
  res.redirect("/");
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

router.get("/dashboard", (req, res, next) => {
  studentModel.find().then((student) => {
    res.render("dashboard", { student });
  });
});
// Course routes
router.get("/course", (req, res, next) => {
  courseModel.find().then((course) => {
    res.render("course", { course });
  });
});
router.post("/course", (req, res, next) => {
  courseModel
    .create({
      courseName: req.body.courseName,
      courseCode: req.body.courseCode,
      courseDuration: req.body.courseDuration,
    })
    .then(() => {
      res.redirect("/course");
    });
});
router.get("/addFeeStructure", (req, res, next) => {
  courseModel.find().then((course) => {
    res.render("addFeeStructure", { course });
  });
});
router.post("/addFeeStructure", async (req, res, next) => {
  const { selectCourse, totalFee } = req.body;
  const course = await courseModel.findOne({ _id: selectCourse });
  course.totalFee = totalFee;
  await course.save();
  res.redirect("/addFeeStructure");
});
router.get("/deletecourse/:id", async (req, res, next) => {
  await courseModel.findOneAndDelete({ _id: req.params.id });
  res.redirect("back");
});

// Inquiry routes
router.get("/inquiry", async (req, res, next) => {
  const course = await courseModel.find();
  res.render("inquiry", { course });
});
router.post("/inquiry", async (req, res, next) => {
  console.log(req.body);
  await studentModel.create(req.body);
  res.redirect("/allenquiry");
});
router.get("/allenquiry", async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: false })
    .populate("course");
  res.render("allenquiry", { students });
});
router.get("/delete/enquiry/:id", async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = true;
  await student.save();
  res.redirect("back");
});
router.get("/accepted/enquiry/:id", async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = false;
  await student.save();
  res.redirect("back");
});
router.get("/rejected", async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: true })
    .populate("course");
  res.render("rejected", { students });
});

router.get("/student", (req, res, next) => {
  studentModel.find().then((std) => {
    res.render("student", { std });
  });
});
router.get("/addStaff", (req, res, next) => {
  res.render("addStaff");
});
router.post("/addStaff", (req, res, next) => {
  staffModel
    .create({
      firstName: req.body.firstName,
      secondName: req.body.secondName,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      qualification: req.body.qualification,
      contactNumber: req.body.contactNumber,
      email: req.body.email,
      dob: req.body.dob,
      address: req.body.address,
      totalExperience: req.body.totalExperience,
      salary: req.body.salary,
      joinDate: req.body.joinDate,
      jobTiming: req.body.jobTiming,
      position: req.body.position,
    })
    .then(() => {
      res.redirect("/allStaff");
    });
});
router.get("/profile", (req, res, next) => {
  res.render("profile");
});
router.get("/fees", async (req, res, next) => {
  const students = await studentModel.find().populate("course");
  students.sort(function (a, b) {
    return new Date(b.dueDate) - new Date(a.dueDate);
  });
  res.render("fees", { students: students.filter((e) => e.due > 0) });
});
router.get("/getdate", async (req, res, next) => {
  const students = await studentModel.find().populate("course");
  students.sort(function (a, b) {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  res.json({ students: students.filter((e) => e.due > 0) });
});
router.get("/stdprofile/:id", async (req, res, next) => {
  const founduser = await studentModel
    .findOne({
      _id: req.params.id,
    })
    .populate("course");
  res.render("stdprofile", { founduser });
});
router.get("/allStaff", (req, res, next) => {
  staffModel.find().then((staff) => {
    res.render("allStaff", { staff });
  });
});
router.get("/edit/:id", async (req, res, next) => {
  const founduser = await studentModel.findOne({
    _id: req.params.id,
  });
  res.render("edit", { founduser });
});
router.post("/update/profile/:id", async (req, res, next) => {
  await studentModel.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    req.body
  );

  res.redirect("back");
});
router.post("/update/due/:id", async (req, res, next) => {
  const foundstudent = await studentModel.findOne({
    _id: req.params.id,
  });
  foundstudent.due = foundstudent.due - +req.body.paid;
  await foundstudent.save();
  await feesModel.create({
    registrationPaymentMode: req.body.registrationPaymentMode,
    student: foundstudent._id,
    payment: req.body.paid,
  });
  res.redirect("/fees");
});
router.get("/feesManagement", async (req, res, next) => {
  if (req.query.prev) {
    var fees = await feesModel
      .find({ payDate: { $gte: req.query.prev, $lte: req.query.next } })
      .populate("student");
  } else {
    var fees = await feesModel.find().populate("student");
  }
  res.render("feesManagement", { fees });
});
router.get("/delete/transaction/:id", async (req, res, next) => {
  await feesModel.findOneAndDelete({
    _id: req.params.id,
  });
  res.redirect("/feesManagement");
});

module.exports = router;
