import { Router } from "express";
const router = Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log(1);
  res.render("index", { title: "Express" });
});

export default router;
