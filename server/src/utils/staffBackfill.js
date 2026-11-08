import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';

export const backfillStaffCredentials = async () => {
  try {
    // 1. Kautilya Manager default
    const mgrKautilya = await User.findOne({ email: 'manager@messmate.edu' });
    if (mgrKautilya && (!mgrKautilya.staffId || !mgrKautilya.staffPin)) {
      mgrKautilya.staffId = 'MGR-101';
      mgrKautilya.staffPin = '1234';
      await mgrKautilya.save();
      console.log('[Backfill] Updated Kautilya Manager with staffId: MGR-101 and staffPin: 1234');
    }

    // 2. All other managers
    const managers = await User.find({ role: ROLES.MESS_MANAGER });
    let mgrIdx = 101;
    for (const mgr of managers) {
      if (!mgr.staffId || !mgr.staffPin) {
        mgr.staffId = `MGR-${mgrIdx}`;
        mgr.staffPin = '1234';
        await mgr.save();
        console.log(`[Backfill] Updated Manager ${mgr.email} with staffId: ${mgr.staffId}`);
      }
      mgrIdx++;
    }

    // 3. Kautilya Staff default
    const staffKautilya = await User.findOne({ email: 'staff@messmate.edu' });
    if (staffKautilya && (!staffKautilya.staffId || !staffKautilya.staffPin)) {
      staffKautilya.staffId = 'STF-101';
      staffKautilya.staffPin = '1234';
      await staffKautilya.save();
      console.log('[Backfill] Updated Kautilya Staff with staffId: STF-101 and staffPin: 1234');
    }

    // 4. All other staff members
    const staffList = await User.find({ role: ROLES.MESS_STAFF });
    let stfIdx = 101;
    for (const stf of staffList) {
      if (!stf.staffId || !stf.staffPin) {
        stf.staffId = `STF-${stfIdx}`;
        stf.staffPin = '1234';
        await stf.save();
        console.log(`[Backfill] Updated Staff ${stf.email} with staffId: ${stf.staffId}`);
      }
      stfIdx++;
    }
  } catch (err) {
    console.warn('[Backfill Warning] Could not backfill staff credentials:', err.message);
  }
};
