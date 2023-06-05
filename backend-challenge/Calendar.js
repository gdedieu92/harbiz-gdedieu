const moment = require('moment')
const fs = require('fs');

const timeFormat = `HH:mm`;
const fileDateFormat = `DD-MM-YYYY ${timeFormat}`;


class ReadFile {
	constructor(filename) {
		try {
			this.buffer = fs.readFileSync(filename);
		} catch (error) {
			console.log('there is an error on the file you try to import', error);
		}

	}

	parseJson() {
		return JSON.parse(this.buffer);
	}
}

class ResponseManagerInterface {
	sendResponse() { }
}

class SimpleResponseManager {
	sendResponse(filteredSlotsArray, date) {
		let formattedArray = [];
		if (filteredSlotsArray) {
			filteredSlotsArray.forEach(slot => {
				formattedArray.push({
					startHour: moment.utc(date + ` ` + slot.start, fileDateFormat)
						.toDate(),
					endHour: moment.utc(date + ` ` + slot.end, fileDateFormat)
						.toDate(),
				});
			})
		}
		return formattedArray
	}
}

class Calendar {

	constructor(calendarData, responseManager) {
		this.responseManager = responseManager;
		this.calendarData = calendarData;
	}

	getAllSlots() {
		return this.calendarData.slots;
	}

	getAllSession() {
		return this.calendarData.sessions;
	}

	getDurationBefore() {
		return this.calendarData.durationBefore;
	}

	getDurationAfter() {
		return this.calendarData.durationAfter;
	}

	getSlotsByDate(date) {
		const dateSlots = this.getAllSlots();
		let slotsByDate = [];
		if (dateSlots[date] != undefined) slotsByDate = dateSlots[date]
		return slotsByDate;
	}

	getSessionsByDate(date) {
		const sessions = this.getAllSession();
		let sessionsByDate = [];
		if (sessions[date] != undefined) sessionsByDate = sessions[date]
		return sessionsByDate;
	}

	splitSlotsByDuration(slots, duration) {
		let splittedSlots = [];

		slots.forEach(eachSlot => {
			const durationSlots = this.splitSlotByDuration(eachSlot, duration);
			splittedSlots = splittedSlots.concat(...durationSlots);
		})

		return splittedSlots;
	}

	splitSlotByDuration(slot, duration) {
		if (!slot || typeof slot !== 'object' || !duration || typeof duration !== 'number') {
			throw new Error('Invalid input data format');
		}

		if (duration <= 0 || isNaN(duration)) {
			throw new Error('Duration value must be a positive integer');
		}


		const sessionDuration = this.calculateSessionDuration(duration);
		let dateTimeStart = moment(slot.start, timeFormat);
		let dateTimeEnd = moment(slot.end, timeFormat);
		const minutesRange = this.diffMinutes(dateTimeStart, dateTimeEnd);

		const durationSlots = this.generateDurationSlots(minutesRange, sessionDuration, dateTimeStart);
		return durationSlots;
	}

	generateDurationSlots(minutesRange, sessionDuration, dateTimeStart) {
		let durationSlots = [];
		const slotsToCreate = Math.floor(minutesRange / sessionDuration);
		if (slotsToCreate) {
			for (let x = 0; x < slotsToCreate; x++) {
				durationSlots.push({
					start: dateTimeStart.format(timeFormat),
					end: dateTimeStart.add(sessionDuration, `minutes`).format(timeFormat)
				})
			}
		}
		return durationSlots;
	}

	calculateSessionDuration(duration) {
		return parseInt(duration) + parseInt(this.getDurationBefore()) + parseInt(this.getDurationAfter());
	}

	dateTimeByDateAndTime(time) {
		return moment(time, fileDateFormat);
	}

	diffMinutes(dateTimeStart, dateTimeEnd) {
		return dateTimeEnd.diff(dateTimeStart, `minutes`);
	}

	removeSlotsWithSessions(splittedSlots, dateSessions) {
		let filteredSessions = [];
		let indexToRemove = [];
		splittedSlots.forEach((eachSlot, idx) => {
			dateSessions.forEach(session => {
				let isBetween = this.isSessionTimeBetweenRange(eachSlot.start, eachSlot.end, session.start, session.end);
				if (isBetween) indexToRemove.push(idx);
			})
		})

		filteredSessions = splittedSlots.filter((val, index) => !indexToRemove.includes(index));

		return filteredSessions;
	}

	isSessionTimeBetweenRange(rangeStart, rangeEnd, sessionStart, sessionEnd) {
		let status = false;
		const mRangeStart = moment(rangeStart, timeFormat);
		const mRangeEnd = moment(rangeEnd, timeFormat);

		const mSessionStart = moment(sessionStart, timeFormat);
		const mSessionEnd = moment(sessionEnd, timeFormat);

		if (mRangeEnd.isBetween(mSessionStart, mSessionEnd) || mRangeStart.isBetween(mSessionStart, mSessionEnd)) {
			status = true;
		}
		return status;
	}

	getAvailableSlotsByDateAndDuration(date, duration) {
		const slotsByDate = this.getSlotsByDate(date);
		const splittedSlots = this.splitSlotsByDuration(slotsByDate, duration);
		const dateSessions = this.getSessionsByDate(date);
		const filteredSlots = this.removeSlotsWithSessions(splittedSlots, dateSessions);

		return this.responseManager.sendResponse(filteredSlots, date);;
	}

}


function getAvailableSpots(calendar, date, duration) {

	let calendarData = new ReadFile(`./calendars/calendar.${calendar}.json`).parseJson();
	let calendarObj = new Calendar(calendarData, new SimpleResponseManager());
	return (calendarObj.getAvailableSlotsByDateAndDuration(date, duration));
}

module.exports = { getAvailableSpots }
