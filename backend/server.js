// server.js - Express Backend
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import connectDB from "./db.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB (Atlas or Local depending on db.js)
connectDB();

// ========== Schemas ==========

// FD Rate Schema
const fdRateSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  tenure: { type: Number, required: true }, // in months
  interestRate: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  minAmount: { type: Number, default: 10000 },
});

const FDRate = mongoose.model("FDRate", fdRateSchema);

// Prediction Schema
const predictionSchema = new mongoose.Schema({
  bankName: String,
  tenure: Number,
  predictedRate: Number,
  confidence: Number,
  predictionDate: { type: Date, default: Date.now },
  basedOnDataPoints: Number,
});

const Prediction = mongoose.model("Prediction", predictionSchema);

// ========== Helper Functions ==========

// Linear Regression
function linearRegression(data) {
  const n = data.length;
  if (n < 2) return null;

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;

  data.forEach((point, index) => {
    sumX += index;
    sumY += point.rate;
    sumXY += index * point.rate;
    sumXX += index * index;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Confidence Calculation
function calculateConfidence(data, prediction) {
  if (data.length < 3) return 50;

  const variance =
    data.reduce((sum, point) => {
      return sum + Math.pow(point.rate - prediction, 2);
    }, 0) / data.length;

  const confidence = Math.max(0, Math.min(100, 100 - variance * 10));
  return Math.round(confidence);
}

// ========== Routes ==========

// Test Route
app.get("/", (req, res) => res.send("✅ MongoDB Atlas Connected!"));

// Add FD Rate
app.post("/api/fd-rates", async (req, res) => {
  try {
    const fdRate = new FDRate(req.body);
    await fdRate.save();
    res.status(201).json(fdRate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all FD Rates
app.get("/api/fd-rates", async (req, res) => {
  try {
    const rates = await FDRate.find().sort({ date: -1 });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get FD Rates by Bank and Tenure
app.get("/api/fd-rates/:bankName/:tenure", async (req, res) => {
  try {
    const rates = await FDRate.find({
      bankName: req.params.bankName,
      tenure: parseInt(req.params.tenure),
    }).sort({ date: 1 });
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique banks
app.get("/api/banks", async (req, res) => {
  try {
    const banks = await FDRate.distinct("bankName");
    res.json(banks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Prediction
app.post("/api/predict", async (req, res) => {
  try {
    const { bankName, tenure } = req.body;

    const historicalRates = await FDRate.find({ bankName, tenure })
      .sort({ date: 1 })
      .limit(50);

    if (historicalRates.length < 2) {
      return res.status(400).json({
        error: "Insufficient data for prediction. Need at least 2 data points.",
      });
    }

    const data = historicalRates.map((rate) => ({
      date: rate.date,
      rate: rate.interestRate,
    }));

    const regression = linearRegression(data);
    if (!regression)
      return res.status(400).json({ error: "Unable to calculate prediction" });

    const nextPeriod = data.length;
    const predictedRate = regression.slope * nextPeriod + regression.intercept;
    const roundedPrediction = Math.max(
      0,
      Math.round(predictedRate * 100) / 100
    );

    const confidence = calculateConfidence(data, predictedRate);

    const prediction = new Prediction({
      bankName,
      tenure,
      predictedRate: roundedPrediction,
      confidence,
      basedOnDataPoints: data.length,
    });

    await prediction.save();

    res.json({
      prediction: roundedPrediction,
      confidence,
      trend:
        regression.slope > 0
          ? "increasing"
          : regression.slope < 0
          ? "decreasing"
          : "stable",
      dataPoints: data.length,
      historicalData: data,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all predictions
app.get("/api/predictions", async (req, res) => {
  try {
    const predictions = await Prediction.find().sort({ predictionDate: -1 });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed sample data
app.post("/api/seed", async (req, res) => {
  try {
    await FDRate.deleteMany({});

    const banks = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank"];
    const tenures = [6, 12, 24, 36];
    const sampleData = [];

    for (let month = 5; month >= 0; month--) {
      banks.forEach((bank) => {
        tenures.forEach((tenure) => {
          const baseRate = 6.5 + Math.random() * 2;
          const date = new Date();
          date.setMonth(date.getMonth() - month);

          sampleData.push({
            bankName: bank,
            tenure,
            interestRate: Math.round(
              (baseRate + (tenure / 12) * 0.5) * 100
            ) / 100,
            date,
            minAmount: 10000,
          });
        });
      });
    }

    await FDRate.insertMany(sampleData);
    res.json({
      message: "Sample data seeded successfully",
      count: sampleData.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete FD Rate
app.delete("/api/fd-rates/:id", async (req, res) => {
  try {
    await FDRate.findByIdAndDelete(req.params.id);
    res.json({ message: "FD Rate deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== Start Server ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
