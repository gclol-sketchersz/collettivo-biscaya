import { CallValidator } from './server/scrapers/call-validator.ts';

console.log('=== Testing CallValidator ===\n');

// Test 1: Valid call
console.log('Test 1: Valid call (residency)');
const result1 = CallValidator.isValidCall(
  'Bando per residenza artistica',
  'Cerchiamo artisti per una residenza di 3 mesi in Italia. Scadenza 30 giugno 2026',
  'test'
);
console.log(`Result: ${result1} (expected: true)\n`);

// Test 2: Article (should be rejected)
console.log('Test 2: Article (should be rejected)');
const result2 = CallValidator.isValidCall(
  'I Kabakov arrivano a Venezia con un racconto intimo della loro vita',
  'Un articolo sulla mostra dei Kabakov a Venezia',
  'test'
);
console.log(`Result: ${result2} (expected: false)\n`);

// Test 3: News (should be rejected)
console.log('Test 3: News article (should be rejected)');
const result3 = CallValidator.isValidCall(
  'Sotheby\'s: un seguace di Bosch venduto per oltre 10 volte la stima',
  'L\'opera è stata venduta all\'asta per un prezzo record',
  'test'
);
console.log(`Result: ${result3} (expected: false)\n`);

// Test 4: Valid fellowship
console.log('Test 4: Valid fellowship');
const result4 = CallValidator.isValidCall(
  '2026 Visiting Artist Fellowship',
  'We are seeking talented artists for a 6-month fellowship program. Deadline: December 31, 2025',
  'test'
);
console.log(`Result: ${result4} (expected: true)\n`);

// Test 5: Extract call type
console.log('Test 5: Extract call type (residency)');
const type1 = CallValidator.extractCallType('Residenza Artistica', 'Residency program');
console.log(`Result: ${type1} (expected: residency)\n`);

// Test 6: Extract call type (fellowship)
console.log('Test 6: Extract call type (fellowship)');
const type2 = CallValidator.extractCallType('Fellowship Program', 'Borsa di studio');
console.log(`Result: ${type2} (expected: fellowship)\n`);

// Test 7: Valid deadline
console.log('Test 7: Valid deadline (future)');
const future = new Date();
future.setDate(future.getDate() + 30);
const deadline1 = CallValidator.isValidDeadline(future);
console.log(`Result: ${deadline1} (expected: true)\n`);

// Test 8: Invalid deadline (too far in past)
console.log('Test 8: Invalid deadline (too far in past)');
const past = new Date();
past.setDate(past.getDate() - 200);
const deadline2 = CallValidator.isValidDeadline(past);
console.log(`Result: ${deadline2} (expected: false)\n`);

console.log('=== All tests completed ===');
