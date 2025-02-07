const { default: axios } = require("axios");
const express = require("express");
require("dotenv").config();

const app = express();

const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("health test 100%");
});

// route for stk push

app.post("/stk-push", (req, res) => {
  const { phone, amount } = req.body;

  res.json({
    message: `Ksh ${amount} sent to ${phone}`,
  });
});

// route for sending link via whatsapp

app.post("/send-link", async (req, res) => {
  const { phone, link } = req.body;

  const formattedPhone = phone.replace(/^0/, "254");

  //   apiwap

  const baseUrl = "https://api.apiwap.com/api/v1";

  try {
    const response = await axios.post(
      `${baseUrl}/send-link`,
      {
        phoneNumber: "+254712345678",
        message:
          "Hello from the created instance!\nThis is a sample text message.",
        type: "text",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.APIWAP_API_KEY}`,
        },
      }
    );

    console.log(response.data);
  } catch (error) {
    res.status(500).json({
      message: "An error occurred",
      error: error.message,
    });
  }
  res.json({
    message: `Link: ${link} sent to ${formattedPhone}`,
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
