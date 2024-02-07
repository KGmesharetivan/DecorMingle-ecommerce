import express from "express";
import cors from "cors";
import paypal from "@paypal/checkout-server-sdk";
import "dotenv/config";
import { getCode } from "country-list";
import admin from "firebase-admin";

const app = express();
const port = 3001;

// Mock database (Replace this with your actual database logic)
const paymentsDatabase = {};

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200,
};

// PayPal client setup
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

// Import and initialize Firebase Admin SDK
import("./decormingle-b79a5-firebase-adminsdk-ict07-085dbf77c5.json", {
  assert: { type: "json" },
})
  .then((serviceAccount) => {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount.default),
    });

    const db = admin.firestore();

    // Express app setup
    app.use(cors(corsOptions));
    app.use(express.json());

    app.get("/", (req, res) => {
      res.send("Server is running successfully!");
    });

    // Create PayPal Payment
    app.post("/create-payment", async (req, res) => {
      const { amount, orderInfo, orderID } = req.body;
      const formattedAmount = Number.parseFloat(amount).toFixed(2);

      if (!formattedAmount || isNaN(formattedAmount) || formattedAmount <= 0) {
        return res.status(400).json({
          error: "Invalid or missing amount. Amount must be greater than zero.",
        });
      }

      const countryCode = orderInfo.country ? getCode(orderInfo.country) : null;
      if (!countryCode) {
        return res.status(400).json({
          error: "Invalid or missing country name.",
        });
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: formattedAmount,
            },
            shipping: {
              name: {
                full_name: orderInfo.name,
              },
              address: {
                address_line_1: orderInfo.address,
                admin_area_2: orderInfo.city,
                postal_code: orderInfo.postalCode,
                country_code: countryCode,
              },
            },
            invoice_id: orderID,
          },
        ],
        application_context: {
          return_url: `http://localhost:3000/thankyou?orderID=${encodeURIComponent(
            orderID
          )}`,
          cancel_url: "http://localhost:3000/home",
        },
      });

      try {
        const order = await client.execute(request);
        const approvalUrl = order.result.links.find(
          (link) => link.rel === "approve"
        ).href;
        res.json({ approvalUrl });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      }
    });

    // Fetch PayPal Payment Details
    app.get("/get-payment-details", async (req, res) => {
      const { paymentId } = req.query;

      const request = new paypal.orders.OrdersGetRequest(paymentId);

      try {
        const order = await client.execute(request);
        const orderDetails = order.result;

        const paidAmount = orderDetails.purchase_units[0].amount.value;
        const payerID = orderDetails.payer.payer_id;

        res.json({ paidAmount, payerID });
      } catch (error) {
        console.error("Error fetching PayPal payment details:", error);
        res.status(500).send("Error fetching PayPal payment details.");
      }
    });

    // Execute PayPal Payment
    app.post("/execute-payment", async (req, res) => {
      const { orderID } = req.body;

      const request = new paypal.orders.OrdersCaptureRequest(orderID);
      request.requestBody({});

      try {
        const capture = await client.execute(request);
        const captureId =
          capture.result.purchase_units[0].payments.captures[0].id;

        const paidAmount = capture.result.purchase_units[0].amount.value;

        paymentsDatabase[captureId] = {
          paidAmount,
          // ... other details you want to store
        };

        res.json({ status: "success", captureId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
      }
    });

    // Endpoint to update user's email, password, displayName, and role
    app.post("/update-user-credentials", async (req, res) => {
      const { uid, newEmail, newPassword, newUsername, newRole } = req.body;

      try {
        // Update the user's email and password in Firebase Authentication
        const userRecord = await admin.auth().updateUser(uid, {
          ...(newEmail && { email: newEmail }),
          ...(newPassword && { password: newPassword }),
          ...(newUsername && { displayName: newUsername }),
        });

        // Update user's username (displayName) and role in Firestore
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
          displayName: newUsername,
          role: newRole,
        });

        res
          .status(200)
          .json({ message: "User credentials updated successfully." });
      } catch (error) {
        console.error("Error updating user credentials:", error);
        res.status(500).json({ error: error.message });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to load service account JSON:", error);
  });