"use strict";

/** Reset the DB to the sample data: `node seed.js` (or `npm run seed`). */

const { mongoose, MONGODB_URI, Registration, SEED } = require("./db");

(async () => {
  await mongoose.connect(MONGODB_URI);
  const del = await Registration.deleteMany({});
  await Registration.insertMany(SEED);
  console.log(`reset ${MONGODB_URI}`);
  console.log(`  removed ${del.deletedCount} registrations`);
  console.log(`  inserted ${SEED.length} registrations`);

  // drop collections left over from earlier designs, if present
  const names = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
  for (const stale of ["booking_portal_invites"]) {
    if (names.includes(stale)) {
      await mongoose.connection.db.dropCollection(stale);
      console.log(`  dropped stale ${stale} collection`);
    }
  }
  await mongoose.disconnect();
})();
