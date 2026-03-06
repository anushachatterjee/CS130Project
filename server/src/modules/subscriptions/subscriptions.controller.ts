import type { Response } from "express";
import type { AuthRequest } from "../auth/middlewares/requireAuth";
import { subscriptionsRepo } from "./repositories/subscriptions.repo";

export const subscriptionsController = {
  async list(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const subscriptions = await subscriptionsRepo.findAll(userId);

    // Convert cents to dollars for frontend
    const formattedSubscriptions = subscriptions.map((row) => ({
      ...row,
      subscription_amount: row.subscription_amount_cents / 100,
    }));

    res.json(formattedSubscriptions);
  },

  async create(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const {
      subscription_title,
      subscription_category,
      subscription_amount,
      billing_cycle,
      next_renewal_date,
      subscription_status,
      subscription_note,
    } = req.body;

    // Validate required fields
    if (
      !subscription_title ||
      !subscription_category ||
      !subscription_amount ||
      !billing_cycle ||
      !subscription_status
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert dollars to cents
    const amount_cents = Math.round(subscription_amount * 100);

    const newSubscription = await subscriptionsRepo.create(userId, {
      title: subscription_title,
      category: subscription_category,
      amount_cents,
      billing_cycle,
      next_renewal_date,
      status: subscription_status,
      note: subscription_note,
    });

    // Convert cents to dollars for response
    const formattedSubscription = {
      ...newSubscription,
      subscription_amount: newSubscription.subscription_amount_cents / 100,
    };

    res.status(201).json(formattedSubscription);
  },

  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const {
      subscription_title,
      subscription_category,
      subscription_amount,
      billing_cycle,
      next_renewal_date,
      subscription_status,
      subscription_note,
    } = req.body;

    // Ensure id is a string
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid subscription ID" });
    }

    // Convert dollars to cents
    const amount_cents = Math.round(subscription_amount * 100);

    const updatedSubscription = await subscriptionsRepo.update(id, {
      title: subscription_title,
      category: subscription_category,
      amount_cents,
      billing_cycle,
      next_renewal_date,
      status: subscription_status,
      note: subscription_note,
    });

    if (!updatedSubscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Convert cents to dollars for response
    const formattedSubscription = {
      ...updatedSubscription,
      subscription_amount: updatedSubscription.subscription_amount_cents / 100,
    };

    res.json(formattedSubscription);
  },

  async remove(req: AuthRequest, res: Response) {
    const { id } = req.params;

    // Ensure id is a string
    if (typeof id !== 'string') {
      return res.status(400).json({ error: "Invalid subscription ID" });
    }

    const deleted = await subscriptionsRepo.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({ success: true, subscription_id: id });
  },
};
