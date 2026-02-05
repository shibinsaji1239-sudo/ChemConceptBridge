const path = require('path');
const User = require('./models/User');

// Test 1: Verify User model subscription enum includes ar_multimedia
console.log('=== Testing User Model Subscription Enum ===');
try {
  const enumValues = User.schema.path('subscription.plan').enumValues;
  console.log('Subscription enum values:', enumValues);

  const expectedPlans = ['free', 'pro', 'teacher'];
  const hasAllPlans = expectedPlans.every(plan => enumValues.includes(plan));

  if (hasAllPlans) {
    console.log('✅ PASS: All expected subscription plans are present');
  } else {
    console.log('❌ FAIL: Missing some subscription plans');
  }
} catch (error) {
  console.log('❌ ERROR: Failed to load User model subscription enum:', error.message);
}

// Test 2: Verify payment routes PLAN_PRICES includes ar_multimedia
console.log('\n=== Testing Payment Routes PLAN_PRICES ===');
try {
  const paymentRoutes = require('./routes/payment');
  // We can't directly access PLAN_PRICES from the module, so we'll check the file content
  const fs = require('fs');
  const paymentFile = fs.readFileSync(path.join(__dirname, 'routes', 'payment.js'), 'utf8');

  if (!paymentFile.includes('ar_multimedia:')) {
    console.log('✅ PASS: ar_multimedia plan pricing has been removed');
  } else {
    console.log('❌ FAIL: ar_multimedia plan pricing still exists');
  }

  if (paymentFile.includes('PLAN_PRICES')) {
    console.log('✅ PASS: PLAN_PRICES object exists in payment routes');
  } else {
    console.log('❌ FAIL: PLAN_PRICES object not found');
  }
} catch (error) {
  console.log('❌ ERROR: Failed to test payment routes:', error.message);
}

// Test 3: Verify frontend subscription page includes ar_multimedia plan
console.log('\n=== Testing Frontend Subscription Page ===');
try {
  const fs = require('fs');
  const subscriptionPagePath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'SubscriptionPage.js');
  const subscriptionPage = fs.readFileSync(subscriptionPagePath, 'utf8');

  if (!subscriptionPage.includes('ar_multimedia')) {
    console.log('✅ PASS: ar_multimedia plan is NOT included in SubscriptionPage (restricted to pro/teacher)');
  } else {
    console.log('❌ FAIL: ar_multimedia plan still found in SubscriptionPage');
  }

  if (subscriptionPage.includes('AR Multimedia access')) {
    console.log('✅ PASS: AR Multimedia access is mentioned as a feature');
  } else {
    console.log('❌ FAIL: AR Multimedia access feature not mentioned');
  }
} catch (error) {
  console.log('❌ ERROR: Failed to test frontend subscription page:', error.message);
}

// Test 4: Verify ARMultimediaModule has subscription check
console.log('\n=== Testing ARMultimediaModule Access Control ===');
try {
  const fs = require('fs');
  const path = require('path');
  const arModulePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'ARMultimedia', 'ARMultimediaModule.js');
  const arModule = fs.readFileSync(arModulePath, 'utf8');

  if (arModule.includes('hasAccess')) {
    console.log('✅ PASS: ARMultimediaModule has access control state');
  } else {
    console.log('❌ FAIL: ARMultimediaModule missing access control state');
  }

  if (arModule.includes('checkSubscription')) {
    console.log('✅ PASS: ARMultimediaModule has subscription checking logic');
  } else {
    console.log('❌ FAIL: ARMultimediaModule missing subscription checking logic');
  }

  if (arModule.includes('pro') && arModule.includes('teacher') && !arModule.includes('ar_multimedia')) {
    console.log('✅ PASS: ARMultimediaModule checks for correct allowed plans (pro and teacher only)');
  } else {
    console.log('❌ FAIL: ARMultimediaModule allowed plans check is incorrect');
  }

  if (arModule.includes('subscription-prompt')) {
    console.log('✅ PASS: ARMultimediaModule has subscription prompt UI');
  } else {
    console.log('❌ FAIL: ARMultimediaModule missing subscription prompt UI');
  }
} catch (error) {
  console.log('❌ ERROR: Failed to test ARMultimediaModule:', error.message);
}

console.log('\n=== Test Summary ===');
console.log('Thorough testing completed. Check results above for any failures.');

