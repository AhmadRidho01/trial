require("dotenv").config(); // Baris paling atas wajib ada ini
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000; // Gunakan port dinamis untuk hosting nanti

app.use(cors());

app.get("/api/quotes", async (req, res) => {
  try {
    const response = await axios.get("https://api.api-ninjas.com/v1/quotes", {
      headers: { "X-Api-Key": process.env.NINJA_API_KEY }, // Memanggil dari .env
    });
    res.json(response.data);
  } catch (error) {
    console.log(
      "Detail Error Ninja:",
      error.response ? error.response.data : error.message,
    );

    res.status(500).json({ error: "Gagal mengambil data" });
  }
});

module.exports = app;
