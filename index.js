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


// mpesa token middleware

const mpesaTokenMiddleware = async (req, res, next) => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    
    try {
        const response = await axios.get(url, {
        headers: {
            Authorization: `Basic ${auth}`,
        },
        });
    
        req.mpesaToken = response.data.access_token;
    
        next();
    } catch (error) {
        res.status(500).json({
        message: "An error occurred",
        error: error.message,
        });
    }       
}

// route for stk push

app.post("/stk-push",mpesaTokenMiddleware, async(req, res) => {
    const { phone, amount } = req.body;
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const token = req.mpesaToken;

    const callbackUrl = "https://ngrokurl.com/stkcallback";

    try {
        
        const timestamp = new Date()
        .toISOString()  
        .replace(/[^0-9]/g, "")
        .slice(0, -3);
    
    
    
        const password = Buffer.from(
            `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
          ).toString("base64");

        const response = await axios.post(  
            url,
            {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerPayBillOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: process.env.MPESA_SHORTCODE,
                PhoneNumber: phone,
                CallBackURL: "https://mycallbackurl.com",
                AccountReference: "Test",
                TransactionDesc: "Test",
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log(response.data);
        res.json({
            message: "STK push initiated",
            data: response.data,
        });
    } catch (error) {
        res.status(500).json({
        message: "An error occurred",
        error: error.message,
        });
        
    }
});

// route for sending link via whatsapp

app.post("/send-link", async (req, res) => {
  const { phone, link } = req.body;

  //   apiwap

  if(!phone || !link){

    return res.status(400).json({
        message: "Phone and link are required",
        });
    }

  const baseUrl = "https://api.apiwap.com/api/v1";

  try {
    const response = await axios.post(
      `${baseUrl}/whatsapp/send-message`,
      {
        phoneNumber: `+${phone}`,
        message:
          `Hello please pay via the link below\n\n${link}.`,
        type: "text",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.APIWAP_API_KEY}`,
        },
      }
    );

    console.log(response.data);

    res.json({
        message: `Link: ${link} sent to ${phone}`,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "An error occurred",
      error: error.message,
    });
  }
});

app.post("/stkcallback",(req, res)=>{
    console.log(req.body);
    res.json({
        message: "Callback received",
        data: req.body,
    });

    // save the data to supabase

})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
