const supabase = require('../../config/supabase');
const automationService = require('./automation.service');

async function checkAbandonedCarts() {
  try {
    console.log('Checking for abandoned carts...');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: abandonedCarts, error } = await supabase
      .from('abandoned_carts')
      .select(`
        id,
        user_id,
        cart_value,
        last_activity_at,
        reminder_sent,
        auth.users!inner(email, raw_user_meta_data)
      `)
      .eq('status', 'ACTIVE')
      .lt('last_activity_at', twoHoursAgo)
      .or('reminder_sent.is.null,reminder_sent.eq.false');

    if (error) {
      console.error('Error fetching abandoned carts:', error);
      return;
    }

    if (!abandonedCarts || abandonedCarts.length === 0) {
      console.log('No abandoned carts found');
      return;
    }

    console.log(`Found ${abandonedCarts.length} abandoned carts`);

    for (const cart of abandonedCarts) {
      try {
        const user = cart.users;
        const customerName = user?.raw_user_meta_data?.full_name || 'Valued Customer';
        const email = user?.email;

        if (email) {
          await automationService.triggerAutomation('cart_abandoned', {
            user_id: cart.user_id,
            email: email,
            customer_name: customerName,
            cart_value: cart.cart_value
          });

          await supabase
            .from('abandoned_carts')
            .update({ reminder_sent: true })
            .eq('id', cart.id);

          console.log(`Sent abandoned cart reminder to ${email}`);
        }
      } catch (cartError) {
        console.error(`Error processing abandoned cart ${cart.id}:`, cartError);
      }
    }
  } catch (error) {
    console.error('Error in checkAbandonedCarts:', error);
  }
}

const INTERVAL_MS = 30 * 60 * 1000;

function startWorker() {
  console.log('Starting abandoned cart worker...');
  
  checkAbandonedCarts();
  
  setInterval(() => {
    checkAbandonedCarts();
  }, INTERVAL_MS);
}

module.exports = { startWorker, checkAbandonedCarts };
