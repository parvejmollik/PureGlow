import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rules = fs.readFileSync('firestore.rules', 'utf8');

test('firestore.rules enforces global deny-all and eight pillars invariants', () => {
  assert.match(rules, /rules_version = '2';/);
  assert.match(rules, /allow read, write: if false;/);
  assert.match(rules, /isValidProduct\(data\)/);
  assert.match(rules, /isValidUserProfile\(data\)/);
  assert.match(rules, /isValidOrder\(data\)/);
  assert.match(rules, /isValidNotification\(data\)/);
  assert.match(rules, /isValidStaffPermission\(data\)/);
  assert.match(rules, /match \/staff_permissions\/\{permId\}/);
  assert.match(rules, /hasStaffPermission\('manage_stock'\)/);
  assert.match(rules, /hasStaffPermission\('manage_products'\)/);
  assert.match(rules, /hasStaffPermission\('manage_orders'\)/);
  assert.match(rules, /email_verified == true/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly/);
  assert.match(rules, /createdAt == request\.time/);
});
