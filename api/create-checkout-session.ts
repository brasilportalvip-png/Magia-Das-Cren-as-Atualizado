import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-04-30.basil',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Plano PRO - Magia Das Crenças',
              description:
                'Consultas espirituais premium, tarot, búzios e recursos exclusivos.',
            },
            unit_amount: 1990,
          },
          quantity: 1,
        },
      ],

      mode: 'payment',

      success_url:
        'https://www.magiadascrencas.com.br/sucesso',

      cancel_url:
        'https://www.magiadascrencas.com.br',

    });

    res.status(200).json({
      id: session.id,
    });
  } catch (error: any) {
    console.error('Stripe Error:', error);

    res.status(500).json({
      error: error.message,
    });
  }
}