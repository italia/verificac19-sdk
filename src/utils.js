const addHours = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000);

const addDays = (date, days) => addHours(date, 24 * days);

module.exports = {
  addHours, addDays,
};
