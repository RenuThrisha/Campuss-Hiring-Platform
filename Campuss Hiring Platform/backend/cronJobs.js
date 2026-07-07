const cron = require('node-cron');
const Student = require('./models/studentModel');

const initCronJobs = () => {
    // Run at 00:00 on September 1st
    cron.schedule('0 0 1 9 *', async () => {
        console.log('Running Academic Year Update Job...');
        try {
            // Update 3rd -> 4th
            await Student.updateMany({ year: '3rd' }, { year: '4th' });
            // Update 2nd -> 3rd
            await Student.updateMany({ year: '2nd' }, { year: '3rd' });
            // Update 1st -> 2nd
            await Student.updateMany({ year: '1st' }, { year: '2nd' });

            // Optional: Handle 4th years (e.g., move to "Alumni" or just leave as 4th/Graduated)
            // For now, let's leave them as 4th or maybe add a status field later.
            // The prompt says "from sept onwards the student's academic year should update automatically"
            // The updates above handle the progression.

            console.log('Academic Year Update Completed Successfully.');
        } catch (err) {
            console.error('Error updating academic years:', err);
        }
    });

    console.log('Cron jobs initialized: Academic Year Update scheduled for Sept 1st.');
};

module.exports = initCronJobs;
