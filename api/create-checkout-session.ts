import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27" as any,
});

export default async function handler(req: any, res: any) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "STRIPE_SECRET_KEY não configurada no ambiente" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { userId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Plano PRO - Magia Das Crenças",
              description: "Recarga de 50 créditos de Energia Vital com Cigano Pablo.",
            },
            unit_amount: 1990, // R$ 19,90
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://www.magiadascrencas.com.br/sucesso`,
      cancel_url: `https://www.magiadascrencas.com.br`,
      metadata: {
        userId,
        credits: "50",
      },
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
