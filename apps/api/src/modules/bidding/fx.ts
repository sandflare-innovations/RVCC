import { prisma } from "../../lib/prisma";
import type { Currency } from "@prisma/client";

export async function syncExchangeRates() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/SAR");
    if (!res.ok) throw new Error("Failed to fetch rates");
    const data = (await res.json()) as { rates: Record<string, number> };

    // We only sync these currencies for now
    const targets: Currency[] = ["USD", "EUR", "INR", "AED", "SAR"];

    for (const cur of targets) {
      const rateToSar = cur === "SAR" ? 1.0 : 1 / (data.rates[cur] || 1);
      await prisma.exchangeRate.upsert({
        where: { currency: cur },
        update: { rateToSar },
        create: { currency: cur, rateToSar },
      });
    }
    console.log("[Worker] Exchange rates synchronized successfully.");
  } catch (error) {
    console.error("[Worker] Failed to sync exchange rates", error);
    throw error;
  }
}
