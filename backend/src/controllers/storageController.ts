import { Request, Response } from "express";
import { getCloudinaryUsage } from "../services/cloudinaryService";

export const getUsage = async (req: Request, res: Response): Promise<any> => {
  try {
    const usage = await getCloudinaryUsage();
    if (usage.error) {
      return res.status(400).json({ success: false, message: usage.error });
    }
    res.json({ success: true, data: usage });
  } catch (error) {
    console.error("Get storage usage error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch storage usage" });
  }
};
