import mongoose from "mongoose";
const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    transactions: [
      {
        amount: {
          type: Number,
          required: true,
        },

        date: {
          type: Date,
          default: Date.now,
        },

        description: {
          type: String,
        },

        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "order",
          default: null,
        },

        transactionType: {
          type: String,
          enum: ["debited", "credited"],
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "completed",
        },
      },
    ],
  },
  { timestamps: true },
);
const wallet = mongoose.model("wallet", walletSchema);
export default wallet;
