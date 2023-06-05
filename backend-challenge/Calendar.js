const moment = require('moment')
const fs = require('fs');

const timeFormat = "HH:mm";
const fileDateFormat = `DD-MM-YYYY ${timeFormat}`;
const isoDateFormat = `YYYY-MM-DD ${timeFormat}`;

class ReadFile {
	constructor(filename) {
		this.buffer = fs.readFileSync(filename);
	}

	parseJson() {
		return JSON.parse(this.buffer);
	}
}

class Calendar {

	constructor(calendarData) {
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
		if (isNaN(duration) || duration <= 0) {
			throw new Error('duration must by a positive number');
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
					end: dateTimeStart.add(sessionDuration, 'minutes').format(timeFormat)
				})
			}
		}
		return durationSlots;
	}

	calculateSessionDuration(duration) {
		return parseInt(duration) + parseInt(this.calendarData.durationBefore) + parseInt(this.calendarData.durationAfter);
	}

	dateTimeByDateAndTime(time) {
		return moment(time, fileDateFormat);
	}

	diffMinutes(dateTimeStart, dateTimeEnd) {
		return dateTimeEnd.diff(dateTimeStart, 'minutes');
	}

	removeSlotsWithSessions(splittedSlots, dateSessions) {
		let filteredSessions = [];
		dateSessions.forEach(session => {
			splittedSlots.forEach((eachSlot) => {
				let isBetween = this.isSessionTimeBetweenRange(eachSlot.start, eachSlot.end, session.start, session.end);
				if (!isBetween) {
					filteredSessions.push(eachSlot);
				}
			})
		})

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
		return filteredSlots;
	}

}

class ResponseManager {
	static response(filteredSlotsArray) {
		let formattedArray = [];
		if (filteredSlotsArray.length) {
			filteredSlotsArray.forEach(slot => {
				formattedArray.push({
					startHour: moment.utc(dateISO + ' ' + slot.start)
						.toDate(),
					endHour: moment.utc(dateISO + ' ' + slot.end)
						.toDate(),
					clientStartHour: moment.utc(dateISO + ' ' + clientStartHour)
						.toDate(),
					clientEndHour: moment.utc(dateISO + ' ' + clientEndHour)
						.toDate(),
				});
			})
		}
		return formattedArray;
	}
}


// let calendarData = new ReadFile(`./calendars/calendar.1.json`).parseJson();
// let calendarObj = new Calendar(calendarData);
// // console.log((calendarObj.getAvailableSlotsByDateAndDuration('10-04-2023', 30)));


// // // 

// console.log(getAvailableSpots(1, "10-04-2023", 30));

function getAvailableSpots(calendar, date, duration) {

	// let calendarData = new ReadFile(`./calendars/calendar.${calendar}.json`).parseJson();
	// let calendarObj = new Calendar(calendarData);
	// return ResponseManager.response(calendarObj.getAvailableSlotsByDateAndDuration(date, duration));

	let rawdata = fs.readFileSync('./calendars/calendar.' + calendar + '.json');
	let data = JSON.parse(rawdata);
	const dateISO = moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD')
	let durationBefore = data.durationBefore;
	let durationAfter = data.durationAfter;
	let daySlots = []
	for (const key in data.slots) {
		if (key === date) {
			daySlots = data.slots[key]
		}
	}

	const realSpots = []
	daySlots.forEach(daySlot => {
		if (data.sessions && data.sessions[date]) {
			let noConflicts = true
			data.sessions[date].forEach(sessionSlot => {
				let sessionStart = moment(dateISO + ' ' + sessionSlot.start).valueOf()
				let sessionEnd = moment(dateISO + ' ' + sessionSlot.end).valueOf()
				let start = moment(dateISO + ' ' + daySlot.start).valueOf()
				let end = moment(dateISO + ' ' + daySlot.end).valueOf()
				if (sessionStart > start && sessionEnd < end) {
					realSpots.push({ start: daySlot.start, end: sessionSlot.start })
					realSpots.push({ start: sessionSlot.end, end: daySlot.end })
					noConflicts = false
				} else if (sessionStart === start && sessionEnd < end) {
					realSpots.push({ start: sessionSlot.end, end: daySlot.end })
					noConflicts = false
				} else if (sessionStart > start && sessionEnd === end) {
					realSpots.push({ start: daySlot.start, end: sessionSlot.start })
					noConflicts = false
				} else if (sessionStart === start && sessionEnd === end) {
					noConflicts = false
				}
			})
			if (noConflicts) {
				realSpots.push(daySlot)
			}
		} else {
			realSpots.push(daySlot)
		}
	})

	let arrSlot = [];
	realSpots.forEach(function (slot) {
		let init = 0;
		let startHour;
		let endHour;
		let clientStartHour;
		let clientEndHour;

		function getMomentHour(hour) {
			let finalHourForAdd = moment(dateISO + ' ' + hour);
			return finalHourForAdd;
		}
		function addMinutes(hour, minutes) {
			let result = moment(hour).add(minutes, 'minutes').format('HH:mm');
			return result;
		}
		function removeMinutes(hour, minutes) {
			let result = moment(hour).subtract(minutes, 'minutes').format('HH:mm');
			return result;
		}
		function getOneMiniSlot(startSlot, endSlot) {
			let startHourFirst = getMomentHour(startSlot);

			startHour = startHourFirst.format('HH:mm');;
			endHour = addMinutes(startHourFirst, durationBefore + duration + durationAfter);
			clientStartHour = addMinutes(startHourFirst, durationBefore);
			clientEndHour = addMinutes(startHourFirst, duration);

			if (moment.utc(endHour, 'HH:mm').valueOf() > moment.utc(endSlot, 'HH:mm').valueOf()) {
				return null;
			}
			const objSlot = {
				startHour: moment.utc(dateISO + ' ' + startHour)
					.toDate(),
				endHour: moment.utc(dateISO + ' ' + endHour)
					.toDate(),
				clientStartHour: moment.utc(dateISO + ' ' + clientStartHour)
					.toDate(),
				clientEndHour: moment.utc(dateISO + ' ' + clientEndHour)
					.toDate(),
			};
			init += 1;
			return objSlot;
		}

		let start = slot.start;
		let resultSlot;
		do {
			resultSlot = getOneMiniSlot(start, slot.end);
			if (resultSlot) {
				arrSlot.push(resultSlot);
				start = moment.utc(resultSlot.endHour).format('HH:mm')
			}
		} while (resultSlot);

		return arrSlot;
	});
	return arrSlot;
}

module.exports = { getAvailableSpots }
